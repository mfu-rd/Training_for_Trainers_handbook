/**
 * data.js — แกนกลางการเคลื่อนไหว token ทั้งหมดของระบบ
 * ---------------------------------------------------
 * กฎเหล็กของไฟล์นี้:
 *  1. ทุกการเปลี่ยนยอด (แจก/หัก/ปรับโควตา/ยกเลิก) ต้องอยู่ใน runTransaction เดียว
 *     เพื่อไม่ให้เกิดสภาวะ "หักโควตาแล้วแต่ยอดผู้รับไม่ขึ้น" หรือกลับกัน
 *  2. ยอดติดลบห้ามเกิดขึ้นเด็ดขาด — ตรวจก่อนเขียนเสมอภายใน transaction เดียวกัน
 *  3. ไม่ลบเอกสารใน transactions จริง — ยกเลิกด้วย status: 'voided' เท่านั้น (audit trail)
 *
 * ข้อจำกัดสำคัญของ Firestore ที่สะท้อนอยู่ในโค้ดนี้:
 *  - ภายใน runTransaction ใช้ "query" ไม่ได้ อ่านได้เฉพาะ doc ที่รู้ ref แล้ว
 *    จึงต้องค้นหา user ด้วย username *ก่อน* เปิด transaction เพื่อให้ได้ uid
 *    แล้วค่อยอ่านเอกสารนั้นซ้ำ *ภายใน* transaction เพื่อล็อกค่าที่ใช้คำนวณจริง
 *  - ภายใน runTransaction ต้องอ่าน (get) ให้ครบก่อน แล้วจึงเขียน (set/update) ทั้งหมด
 */

import { db, normalizeUsername, usernameToEmail, firebaseConfig } from './firebase-init.js';
import {
  initializeApp,
  deleteApp
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as secondarySignOut
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

/** สร้าง Error ภาษาไทยที่มี code ติดมาด้วย */
function appError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/** ตรวจว่า amount เป็นจำนวนเต็มบวก (ระบบนี้ไม่มี token เศษส่วน) */
function assertPositiveAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw appError('data/invalid-amount', 'จำนวน token ต้องเป็นจำนวนเต็มบวก');
  }
  return n;
}

/** แปลง Firestore Timestamp / Date / null ให้เป็นข้อความอ่านง่ายแบบไทย */
export function formatTimestamp(ts) {
  if (!ts) return '';
  const d = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** map snapshot -> array ของ `{ id, ...data }` */
function docsToArray(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ------------------------------------------------------------------ *
 * ผู้ใช้ (users)
 * ------------------------------------------------------------------ */

/**
 * ค้นหาผู้ใช้จากรหัสประจำตัว (username)
 * @param {string} username เช่น 'tft07'
 * @returns {Promise<object|null>} `{ uid, username, fullName, role, tokenBalance?, tokenQuota?, ... }` หรือ null
 */
export async function findUserByUsername(username) {
  const uname = normalizeUsername(username);
  if (!uname) return null;

  const snap = await getDocs(
    query(collection(db, 'users'), where('username', '==', uname), limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() };
}

/**
 * รายชื่อผู้ใช้ทั้งหมด (ใช้ใน AdminOverview / TrainerQuotaSettings / UserManagement)
 * เรียงตาม username จากน้อยไปมาก
 * @returns {Promise<object[]>} array ของ `{ uid, username, fullName, role, ... }`
 */
export async function listAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('username')));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

/* ------------------------------------------------------------------ *
 * แจก token (trainer)
 * ------------------------------------------------------------------ */

/**
 * วิทยากรแจก token ให้ผู้เข้าร่วม — หักจากโควตาของวิทยากรเอง
 *
 * ทั้งหมดนี้เกิดใน transaction เดียว: ตรวจโควตา -> ลดโควตา -> เพิ่มยอดผู้รับ -> บันทึกรายการ
 * ถ้าขั้นใดขั้นหนึ่งล้มเหลว จะไม่มีอะไรถูกเขียนเลย
 *
 * @param {object} params
 * @param {string} params.actorUid uid ของวิทยากรที่กดแจก (auth.currentUser.uid)
 * @param {string} params.targetUsername รหัสประจำตัวผู้รับ เช่น 'tft23'
 * @param {number} params.amount จำนวน token (จำนวนเต็มบวก)
 * @param {string} params.reason เหตุผล เช่น 'ตอบคำถาม'
 * @param {'preset'|'custom'} params.reasonSource ที่มาของเหตุผล (ปุ่มลัด หรือ พิมพ์เอง)
 * @returns {Promise<string>} id ของเอกสาร transactions ที่สร้างใหม่
 * @throws {Error} 'โควตาไม่พอ...' เมื่อโควตาไม่พอ / ข้อความไทยอื่น ๆ
 */
export async function grantToken({ actorUid, targetUsername, amount, reason, reasonSource = 'preset' }) {
  const amt = assertPositiveAmount(amount);
  if (!actorUid) throw appError('data/no-actor', 'ไม่พบผู้ทำรายการ กรุณาเข้าสู่ระบบใหม่');

  // ค้นหาผู้รับก่อนเปิด transaction (ใน transaction ใช้ query ไม่ได้)
  const target = await findUserByUsername(targetUsername);
  if (!target) {
    throw appError('data/target-not-found', `ไม่พบรหัสประจำตัว "${normalizeUsername(targetUsername)}" ในระบบ`);
  }
  if (target.uid === actorUid) {
    throw appError('data/self-grant', 'แจก token ให้ตัวเองไม่ได้');
  }

  const actorRef = doc(db, 'users', actorUid);
  const targetRef = doc(db, 'users', target.uid);
  const txRef = doc(collection(db, 'transactions')); // จอง id ไว้ล่วงหน้าเพื่อคืนค่าให้ผู้เรียก

  await runTransaction(db, async (tx) => {
    // --- อ่านให้ครบก่อน ---
    const actorSnap = await tx.get(actorRef);
    const targetSnap = await tx.get(targetRef);

    if (!actorSnap.exists()) throw appError('data/actor-missing', 'ไม่พบบัญชีผู้ทำรายการ กรุณาเข้าสู่ระบบใหม่');
    if (!targetSnap.exists()) throw appError('data/target-not-found', 'ไม่พบบัญชีผู้รับ กรุณาตรวจสอบรหัสประจำตัว');

    const actorData = actorSnap.data();
    const targetData = targetSnap.data();

    const quota = Number(actorData.tokenQuota ?? 0);
    if (quota < amt) {
      throw appError(
        'data/quota-exceeded',
        `โควตาไม่พอ — คงเหลือ ${quota} token แต่ต้องการแจก ${amt} token`
      );
    }

    const balance = Number(targetData.tokenBalance ?? 0);

    // --- แล้วจึงเขียนทั้งหมด ---
    tx.update(actorRef, { tokenQuota: quota - amt });
    tx.update(targetRef, { tokenBalance: balance + amt });
    tx.set(txRef, {
      type: 'grant',
      actorUid,
      targetUid: target.uid,
      amount: amt,
      reason: String(reason ?? '').trim(),
      reasonSource: reasonSource === 'custom' ? 'custom' : 'preset',
      status: 'active',
      createdAt: serverTimestamp()
    });
  });

  return txRef.id;
}

/* ------------------------------------------------------------------ *
 * หัก token (admin — ใช้คืนประมูล)
 * ------------------------------------------------------------------ */

/**
 * แอดมินหัก token ของผู้ชนะประมูล พร้อมระบุรายการของรางวัลที่แลกไป
 *
 * สิทธิ์ "แอดมินเท่านั้น" บังคับจริงที่ firestore.rules — ฟังก์ชันนี้เป็นฝั่ง client
 * หน้าจอที่เรียกต้องผ่าน requireRole(['admin']) มาก่อนเสมอ
 *
 * @param {object} params
 * @param {string} params.actorUid uid ของแอดมิน
 * @param {string} params.targetUsername รหัสประจำตัวผู้ถูกหัก
 * @param {number} params.amount จำนวน token ที่หัก (จำนวนเต็มบวก)
 * @param {string} params.itemLabel ชื่อของรางวัลที่แลกไป
 * @returns {Promise<string>} id ของเอกสาร transactions ที่สร้างใหม่
 * @throws {Error} 'ยอดไม่พอ...' เมื่อยอดคงเหลือไม่พอ
 */
export async function deductToken({ actorUid, targetUsername, amount, itemLabel }) {
  const amt = assertPositiveAmount(amount);
  if (!actorUid) throw appError('data/no-actor', 'ไม่พบผู้ทำรายการ กรุณาเข้าสู่ระบบใหม่');

  const target = await findUserByUsername(targetUsername);
  if (!target) {
    throw appError('data/target-not-found', `ไม่พบรหัสประจำตัว "${normalizeUsername(targetUsername)}" ในระบบ`);
  }

  const targetRef = doc(db, 'users', target.uid);
  const txRef = doc(collection(db, 'transactions'));

  await runTransaction(db, async (tx) => {
    const targetSnap = await tx.get(targetRef);
    if (!targetSnap.exists()) throw appError('data/target-not-found', 'ไม่พบบัญชีผู้ถูกหัก');

    const balance = Number(targetSnap.data().tokenBalance ?? 0);
    if (balance < amt) {
      throw appError('data/insufficient-balance', `ยอดไม่พอ — คงเหลือ ${balance} token แต่ต้องการหัก ${amt} token`);
    }

    tx.update(targetRef, { tokenBalance: balance - amt });
    tx.set(txRef, {
      type: 'deduct',
      actorUid,
      targetUid: target.uid,
      amount: amt,
      itemLabel: String(itemLabel ?? '').trim(),
      status: 'active',
      createdAt: serverTimestamp()
    });
  });

  return txRef.id;
}

/* ------------------------------------------------------------------ *
 * ปรับโควตาวิทยากร (admin)
 * ------------------------------------------------------------------ */

/**
 * แอดมินตั้งค่าโควตาของวิทยากรเป็นค่าใหม่ (ค่าสัมบูรณ์ ไม่ใช่การบวกเพิ่ม)
 *
 * *** วิธีเก็บค่าใน audit log (สำคัญสำหรับหน้าจอที่แสดงประวัติ) ***
 * เอกสาร transactions ของ type 'quotaAdjust' เก็บ `amount = โควตาใหม่ (ค่าสัมบูรณ์)`
 * ไม่ใช่ส่วนต่าง — และเก็บ `previousQuota` ไว้เพิ่มด้วย เพื่อให้ยังคำนวณส่วนต่างย้อนหลังได้
 * หน้าจอที่แสดงรายการนี้ควรอ่านว่า "ตั้งโควตาเป็น {amount}" ไม่ใช่ "+{amount}"
 *
 * @param {object} params
 * @param {string} params.actorUid uid ของแอดมิน
 * @param {string} params.trainerUid uid ของวิทยากรที่ถูกปรับโควตา
 * @param {number} params.newQuota โควตาใหม่ (จำนวนเต็ม >= 0)
 * @returns {Promise<string>} id ของเอกสาร transactions ที่สร้างใหม่
 */
export async function adjustQuota({ actorUid, trainerUid, newQuota }) {
  if (!actorUid) throw appError('data/no-actor', 'ไม่พบผู้ทำรายการ กรุณาเข้าสู่ระบบใหม่');
  if (!trainerUid) throw appError('data/no-trainer', 'ไม่ได้ระบุวิทยากรที่ต้องการปรับโควตา');

  const quota = Number(newQuota);
  if (!Number.isFinite(quota) || !Number.isInteger(quota) || quota < 0) {
    throw appError('data/invalid-quota', 'โควตาใหม่ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป');
  }

  const trainerRef = doc(db, 'users', trainerUid);
  const txRef = doc(collection(db, 'transactions'));

  await runTransaction(db, async (tx) => {
    const trainerSnap = await tx.get(trainerRef);
    if (!trainerSnap.exists()) throw appError('data/trainer-not-found', 'ไม่พบบัญชีวิทยากรที่ต้องการปรับโควตา');

    const previousQuota = Number(trainerSnap.data().tokenQuota ?? 0);

    tx.update(trainerRef, { tokenQuota: quota });
    tx.set(txRef, {
      type: 'quotaAdjust',
      actorUid,
      trainerUid,
      amount: quota, // = โควตาใหม่ (ค่าสัมบูรณ์) ดูคอมเมนต์ด้านบน
      previousQuota, // เก็บค่าเดิมไว้ให้คำนวณส่วนต่างย้อนหลังได้
      status: 'active',
      createdAt: serverTimestamp()
    });
  });

  return txRef.id;
}

/* ------------------------------------------------------------------ *
 * ยกเลิกรายการ (admin)
 * ------------------------------------------------------------------ */

/**
 * ยกเลิกรายการ (void) พร้อม "ย้อนผลต่อยอด" ให้ครบใน transaction เดียว
 *
 *  - ยกเลิก grant  : ลดยอดผู้รับกลับลง  + คืนโควตาให้วิทยากรผู้แจก
 *  - ยกเลิก deduct : เพิ่มยอดผู้ถูกหักกลับคืน
 *  - quotaAdjust   : ยกเลิกไม่ได้ (ค่าที่เก็บเป็นค่าสัมบูรณ์ การย้อนกลับกำกวม)
 *                    ให้แอดมินใช้ adjustQuota() ตั้งค่าที่ถูกต้องแทน
 *
 * รายการที่ voided แล้วจะ void ซ้ำไม่ได้ (กันการคืนยอดซ้ำสองรอบ)
 *
 * @param {object} params
 * @param {string} params.actorUid uid ของแอดมินที่กดยกเลิก
 * @param {string} params.transactionId id ของเอกสารใน transactions
 * @param {string} params.voidReason เหตุผลที่ยกเลิก
 * @returns {Promise<void>}
 */
export async function voidTransaction({ actorUid, transactionId, voidReason }) {
  if (!actorUid) throw appError('data/no-actor', 'ไม่พบผู้ทำรายการ กรุณาเข้าสู่ระบบใหม่');
  if (!transactionId) throw appError('data/no-transaction', 'ไม่ได้ระบุรายการที่ต้องการยกเลิก');

  const txDocRef = doc(db, 'transactions', transactionId);

  await runTransaction(db, async (tx) => {
    const txSnap = await tx.get(txDocRef);
    if (!txSnap.exists()) throw appError('data/transaction-not-found', 'ไม่พบรายการที่ต้องการยกเลิก');

    const data = txSnap.data();
    if (data.status === 'voided') {
      throw appError('data/already-voided', 'รายการนี้ถูกยกเลิกไปแล้ว ไม่สามารถยกเลิกซ้ำได้');
    }
    if (data.type === 'quotaAdjust') {
      throw appError(
        'data/cannot-void-quota-adjust',
        'รายการปรับโควตายกเลิกย้อนหลังไม่ได้ — กรุณาตั้งค่าโควตาใหม่ที่หน้าตั้งค่าโควตาวิทยากรแทน'
      );
    }

    const amt = Number(data.amount ?? 0);
    const targetRef = data.targetUid ? doc(db, 'users', data.targetUid) : null;
    const actorRefOfOriginal = data.actorUid ? doc(db, 'users', data.actorUid) : null;

    // --- อ่านทุก doc ที่ต้องใช้ให้ครบก่อนเขียน ---
    const targetSnap = targetRef ? await tx.get(targetRef) : null;
    const originalActorSnap =
      data.type === 'grant' && actorRefOfOriginal ? await tx.get(actorRefOfOriginal) : null;

    if (targetRef && (!targetSnap || !targetSnap.exists())) {
      throw appError('data/target-missing', 'ไม่พบบัญชีผู้เกี่ยวข้องของรายการนี้ ยกเลิกไม่ได้');
    }

    const targetBalance = targetSnap ? Number(targetSnap.data().tokenBalance ?? 0) : 0;

    if (data.type === 'grant') {
      if (targetBalance < amt) {
        throw appError(
          'data/insufficient-balance',
          `ยกเลิกไม่ได้ — ยอดคงเหลือของผู้รับ (${targetBalance}) น้อยกว่าจำนวนที่ต้องเรียกคืน (${amt})`
        );
      }
      tx.update(targetRef, { tokenBalance: targetBalance - amt });

      // คืนโควตาให้วิทยากรผู้แจก (ถ้ายังมีบัญชีอยู่)
      if (originalActorSnap && originalActorSnap.exists()) {
        const prevQuota = Number(originalActorSnap.data().tokenQuota ?? 0);
        tx.update(actorRefOfOriginal, { tokenQuota: prevQuota + amt });
      }
    } else if (data.type === 'deduct') {
      tx.update(targetRef, { tokenBalance: targetBalance + amt });
    } else {
      throw appError('data/unknown-type', 'ไม่รู้จักประเภทของรายการนี้ ยกเลิกไม่ได้');
    }

    tx.update(txDocRef, {
      status: 'voided',
      voidedBy: actorUid,
      voidedAt: serverTimestamp(),
      voidReason: String(voidReason ?? '').trim()
    });
  });
}

/* ------------------------------------------------------------------ *
 * อ่านประวัติ (queries — กรองที่ฝั่ง Firestore ไม่ใช่ฝั่ง client)
 * ------------------------------------------------------------------ *
 * หมายเหตุ: query ที่มีทั้ง where + orderBy ต้องมี composite index
 * ครั้งแรกที่รัน Firestore จะโยน error พร้อม "ลิงก์สร้าง index" มาที่ console
 * ให้เปิดลิงก์นั้นกดสร้าง index หนึ่งครั้ง แล้วใช้งานได้ตลอดไป
 *   - transactions: actorUid ASC + createdAt DESC
 *   - transactions: targetUid ASC + createdAt DESC
 */

/**
 * ประวัติรายการที่ "ผู้ใช้คนนี้เป็นคนทำ" (ใช้ใน TrainerHistory)
 * @param {string} actorUid
 * @param {number} [max=100]
 * @returns {Promise<object[]>} `{ id, ...data }` เรียง createdAt ใหม่→เก่า
 */
export async function listTransactionsByActor(actorUid, max = 100) {
  if (!actorUid) return [];
  const snap = await getDocs(
    query(
      collection(db, 'transactions'),
      where('actorUid', '==', actorUid),
      orderBy('createdAt', 'desc'),
      limit(max)
    )
  );
  return docsToArray(snap);
}

/**
 * ประวัติรายการที่ "เกิดกับยอดของผู้ใช้คนนี้" (ใช้ใน ParticipantDashboard)
 * @param {string} targetUid
 * @param {number} [max=100]
 * @returns {Promise<object[]>} `{ id, ...data }` เรียง createdAt ใหม่→เก่า
 */
export async function listTransactionsByTarget(targetUid, max = 100) {
  if (!targetUid) return [];
  const snap = await getDocs(
    query(
      collection(db, 'transactions'),
      where('targetUid', '==', targetUid),
      orderBy('createdAt', 'desc'),
      limit(max)
    )
  );
  return docsToArray(snap);
}

/**
 * รายการทั้งหมดในระบบ (แอดมินเท่านั้น — ใช้ใน TransactionEditor / ExportData)
 * @param {number} [max=500]
 * @returns {Promise<object[]>} `{ id, ...data }` เรียง createdAt ใหม่→เก่า
 */
export async function listAllTransactions(max = 500) {
  const snap = await getDocs(
    query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(max))
  );
  return docsToArray(snap);
}

/**
 * อ่านรายการเดียวตาม id
 * @param {string} transactionId
 * @returns {Promise<object|null>}
 */
export async function getTransaction(transactionId) {
  if (!transactionId) return null;
  const snap = await getDoc(doc(db, 'transactions', transactionId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ------------------------------------------------------------------ *
 * จัดการบัญชี (admin)
 * ------------------------------------------------------------------ */

/**
 * สร้างบัญชีผู้ใช้ใหม่ (Firebase Auth + เอกสาร users/{uid})
 *
 * *** สำคัญมาก — ห้าม "ทำให้ง่ายขึ้น" โดยเรียก createUserWithEmailAndPassword(auth, ...) ***
 * Firebase Auth ฝั่ง client จะ "สลับ session" ไปเป็นบัญชีที่เพิ่งสร้างทันที
 * แปลว่าแอดมินที่กำลังสร้างบัญชีอยู่จะถูกเด้งออกจากระบบ แล้วกลายเป็นบัญชีใหม่แทน
 *
 * ทางแก้ที่ใช้ที่นี่: สร้าง Firebase app instance ตัวที่สองแยกต่างหาก (ชื่อ 'accountCreator')
 * สร้างบัญชีบน auth ของ instance นั้น แล้ว signOut + deleteApp ทิ้งทันที
 * session ของแอดมินใน auth หลัก (firebase-init.js) ไม่ถูกแตะต้องเลย
 *
 * ส่วนการเขียนเอกสาร users/{uid} ใช้ `db` ของ app หลัก จึงถูกนับเป็นการเขียน
 * "โดยแอดมินที่ล็อกอินอยู่" ซึ่งตรงกับ firestore.rules (allow create: if isAdmin())
 *
 * @param {object} params
 * @param {string} params.username รหัสประจำตัวใหม่ เช่น 'tft42'
 * @param {string} params.fullName ชื่อ-นามสกุล
 * @param {'participant'|'trainer'|'admin'} params.role บทบาท
 * @param {string} params.tempPassword รหัสผ่านชั่วคราว (Firebase บังคับอย่างน้อย 6 ตัว)
 * @returns {Promise<{uid: string, username: string}>}
 */
export async function createAccount({ username, fullName, role, tempPassword }) {
  const uname = normalizeUsername(username);
  if (!uname) throw appError('data/invalid-username', 'กรุณาระบุรหัสประจำตัว');
  if (!['participant', 'trainer', 'admin'].includes(role)) {
    throw appError('data/invalid-role', 'บทบาทไม่ถูกต้อง (participant / trainer / admin เท่านั้น)');
  }
  if (!tempPassword || String(tempPassword).length < 6) {
    throw appError('data/weak-password', 'รหัสผ่านชั่วคราวต้องมีอย่างน้อย 6 ตัวอักษร (ข้อกำหนดของ Firebase)');
  }

  // กัน username ซ้ำตั้งแต่ต้น (Auth จะกันซ้ำอยู่แล้วผ่าน email แต่แจ้งเป็นไทยจะเข้าใจง่ายกว่า)
  const existing = await findUserByUsername(uname);
  if (existing) {
    throw appError('data/username-taken', `รหัสประจำตัว "${uname}" ถูกใช้ไปแล้ว`);
  }

  let secondaryApp = null;
  let newUid = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, 'accountCreator');
    const secondaryAuth = getAuth(secondaryApp);
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      usernameToEmail(uname),
      String(tempPassword)
    );
    newUid = cred.user.uid;
    await secondarySignOut(secondaryAuth);
  } catch (e) {
    if (e?.code === 'auth/email-already-in-use') {
      throw appError('data/username-taken', `รหัสประจำตัว "${uname}" ถูกใช้ไปแล้ว`);
    }
    if (e?.code === 'auth/weak-password') {
      throw appError('data/weak-password', 'รหัสผ่านชั่วคราวสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร');
    }
    if (e?.code) throw appError(e.code, 'สร้างบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    throw e;
  } finally {
    // ลบ secondary app ทิ้งทุกกรณี เพื่อให้เรียก createAccount() ซ้ำได้เรื่อย ๆ
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (_) {
        /* ไม่เป็นไร */
      }
    }
  }

  // เขียนโปรไฟล์ด้วย db ของ app หลัก = เขียนในนามแอดมินที่ล็อกอินอยู่
  const profile = {
    username: uname,
    fullName: String(fullName ?? '').trim(),
    role,
    mustChangePassword: true,
    createdAt: serverTimestamp()
  };
  if (role === 'participant') profile.tokenBalance = 0;
  if (role === 'trainer') profile.tokenQuota = 50; // ค่าเริ่มต้นตาม SCOPE.md

  await setDoc(doc(db, 'users', newUid), profile);

  return { uid: newUid, username: uname };
}

/**
 * รีเซ็ตรหัสผ่านของผู้ใช้คนอื่น — *** ยังทำไม่ได้จากฝั่ง client ***
 *
 * ข้อจำกัดจริงของ Firebase (ไม่ใช่เรื่องยังไม่ได้เขียนโค้ด):
 * Firebase Auth client SDK ตั้งรหัสผ่านให้บัญชี "คนอื่น" ไม่ได้เลย
 * updatePassword() ใช้ได้เฉพาะกับผู้ใช้ที่ล็อกอินอยู่เท่านั้น
 * การรีเซ็ตรหัสผ่านให้คนอื่นต้องใช้ Firebase Admin SDK หรือ Cloud Functions
 * ซึ่งอยู่นอกขอบเขตของโปรเจกต์นี้ (สแตกคือ static ไม่มี build step ไม่มีเซิร์ฟเวอร์)
 *
 * *** เทคนิค secondary app ที่ใช้ใน createAccount() ช่วยเรื่องนี้ไม่ได้ ***
 * เพราะมันแค่หลบปัญหา "session โดนสลับ" ไม่ได้ให้สิทธิ์ตั้งรหัสผ่านให้บัญชีอื่น
 *
 * ทางออกปัจจุบัน: แอดมินต้องไปรีเซ็ตเองที่ Firebase Console
 *   Authentication > Users > เลือกบัญชี > Reset password / แก้รหัสผ่าน
 * (บัญชีในคอนโซลจะแสดงเป็น `<username>@tft-e-token.local`)
 *
 * หน้า UserManagement ควรออกแบบปุ่มนี้ให้ "แสดงคำแนะนำ" ไม่ใช่กดแล้วเงียบ
 * จับ error code 'NOT_IMPLEMENTED' แล้วแสดงขั้นตอนให้แอดมินทำเองตามข้อความข้างล่าง
 *
 * @param {object} params
 * @param {string} params.username รหัสประจำตัวที่ต้องการรีเซ็ต
 * @param {string} params.newTempPassword รหัสผ่านชั่วคราวใหม่ที่สุ่มไว้
 * @throws {Error} code `NOT_IMPLEMENTED` เสมอ
 */
export async function resetPassword({ username, newTempPassword }) {
  const uname = normalizeUsername(username);
  throw appError(
    'NOT_IMPLEMENTED',
    `ยังรีเซ็ตรหัสผ่านให้ผู้ใช้คนอื่นจากในเว็บไม่ได้ (ข้อจำกัดของ Firebase ฝั่ง client) — ` +
      `กรุณารีเซ็ตที่ Firebase Console: Authentication > Users > ค้นหา "${uname}@tft-e-token.local" ` +
      `> Reset password แล้วตั้งเป็น "${newTempPassword ?? '(รหัสที่สุ่มไว้)'}" ` +
      `จากนั้นแจ้งรหัสใหม่ให้ผู้ใช้ด้วยตนเอง`
  );
}

/**
 * สุ่มรหัสผ่านชั่วคราวเป็นตัวเลขล้วน
 * SCOPE.md กำหนด "ตัวเลขสุ่มล้วน ไม่เกิน 6 หลัก" และ Firebase บังคับอย่างน้อย 6 ตัวอักษร
 * จึงได้ความยาว 6 หลักพอดี (100000–999999)
 * @returns {string} เช่น '482915'
 */
export function generateTempPassword() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

/* ------------------------------------------------------------------ *
 * Export CSV
 * ------------------------------------------------------------------ */

/** ครอบค่าด้วยเครื่องหมายคำพูดตามมาตรฐาน CSV */
function csvCell(value) {
  if (value === null || value === undefined) return '""';
  const s = typeof value?.toDate === 'function' ? value.toDate().toISOString() : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(headers, rows) {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  return lines.join('\r\n');
}

/**
 * ดึงข้อมูลทั้งหมดออกมาเป็น CSV (ใช้ในหน้า ExportData)
 *
 * คืนค่าเป็น **object ที่มี CSV สองชุด** เพราะ users กับ transactions
 * มีคอลัมน์คนละแบบ รวมเป็นไฟล์เดียวจะอ่านยากใน Excel
 *
 * มี `BOM` ให้แล้วในแต่ละสตริง (`﻿` ต้นไฟล์) เพื่อให้ Excel ภาษาไทยไม่เพี้ยน
 *
 * @returns {Promise<{usersCsv: string, transactionsCsv: string, generatedAt: Date}>}
 */
export async function exportAllDataAsCSV() {
  const [users, transactions] = await Promise.all([listAllUsers(), listAllTransactions(5000)]);

  const userByUid = new Map(users.map((u) => [u.uid, u]));
  const nameOf = (uid) => {
    const u = userByUid.get(uid);
    return u ? `${u.username} (${u.fullName ?? ''})`.trim() : (uid ?? '');
  };

  const usersCsv =
    '﻿' +
    toCsv(
      ['uid', 'username', 'fullName', 'role', 'tokenBalance', 'tokenQuota', 'mustChangePassword', 'createdAt'],
      users.map((u) => [
        u.uid,
        u.username ?? '',
        u.fullName ?? '',
        u.role ?? '',
        u.tokenBalance ?? '',
        u.tokenQuota ?? '',
        u.mustChangePassword ?? '',
        u.createdAt ?? ''
      ])
    );

  const transactionsCsv =
    '﻿' +
    toCsv(
      [
        'transactionId',
        'type',
        'status',
        'amount',
        'actorUid',
        'actor',
        'targetUid',
        'target',
        'trainerUid',
        'trainer',
        'reason',
        'reasonSource',
        'itemLabel',
        'createdAt',
        'voidedBy',
        'voidedAt',
        'voidReason'
      ],
      transactions.map((t) => [
        t.id,
        t.type ?? '',
        t.status ?? '',
        t.amount ?? '',
        t.actorUid ?? '',
        nameOf(t.actorUid),
        t.targetUid ?? '',
        t.targetUid ? nameOf(t.targetUid) : '',
        t.trainerUid ?? '',
        t.trainerUid ? nameOf(t.trainerUid) : '',
        t.reason ?? '',
        t.reasonSource ?? '',
        t.itemLabel ?? '',
        t.createdAt ?? '',
        t.voidedBy ?? '',
        t.voidedAt ?? '',
        t.voidReason ?? ''
      ])
    );

  return { usersCsv, transactionsCsv, generatedAt: new Date() };
}

/**
 * ตัวช่วยดาวน์โหลดสตริง CSV เป็นไฟล์ (ใช้ในหน้า ExportData)
 * @param {string} filename เช่น 'tft-users.csv'
 * @param {string} csvString
 */
export function downloadCsv(filename, csvString) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
