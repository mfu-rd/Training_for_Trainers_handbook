/**
 * auth.js — ระบบล็อกอิน/สิทธิ์ ของระบบแจก e-Token TFT
 * ----------------------------------------------------
 * สร้างบน firebase-init.js
 *
 * โมเดล auth: ผู้ใช้พิมพ์ username เปล่า ๆ (tft01–tft80) + รหัสผ่านตัวเลขชั่วคราว
 * ภายในระบบ map เป็น synthetic email `${username}@tft-e-token.local`
 * ผู้ใช้ไม่เคยเห็นอีเมลนี้เลย
 *
 * ทุกข้อความ error ที่ throw จากไฟล์นี้เป็นภาษาไทย พร้อมแสดงให้ผู้ใช้เห็นได้ทันที
 * (มี .code ติดมาด้วยสำหรับกรณีที่หน้าจอต้องแยกเคส)
 */

import { auth, db, usernameToEmail } from './firebase-init.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  doc,
  getDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

/** สร้าง Error ภาษาไทยที่มี code ติดมาด้วย */
function appError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * ล็อกอินด้วย username + รหัสผ่าน
 *
 * หมายเหตุด้านความปลอดภัย: กรณี "ไม่มีบัญชีนี้" กับ "รหัสผ่านผิด"
 * ถูกรวมเป็นข้อความเดียวกันโดยตั้งใจ เพื่อไม่ให้คนเดาได้ว่า username ไหนมีอยู่จริง
 *
 * @param {string} username เช่น 'tft01'
 * @param {string} password รหัสผ่าน (ชั่วคราวหรือที่ผู้ใช้ตั้งเอง)
 * @returns {Promise<{ authUser: import('https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js').User, profile: object|null }>}
 * @throws {Error} ข้อความภาษาไทยพร้อมแสดงผล
 */
export async function signIn(username, password) {
  if (!username || !password) {
    throw appError('auth/missing-fields', 'กรุณากรอกรหัสประจำตัวและรหัสผ่านให้ครบ');
  }

  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
  } catch (e) {
    switch (e?.code) {
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        // ไม่บอกว่าผิดที่ username หรือ password (กันการไล่เดารหัสประจำตัว)
        throw appError('auth/invalid-credential', 'รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง');
      case 'auth/too-many-requests':
        throw appError('auth/too-many-requests', 'พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่');
      case 'auth/user-disabled':
        throw appError('auth/user-disabled', 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อแอดมิน');
      case 'auth/network-request-failed':
        throw appError('auth/network-request-failed', 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสอบสัญญาณแล้วลองใหม่');
      case 'auth/configuration-not-found':
      case 'auth/operation-not-allowed':
        // ยังไม่ได้เปิดใช้ Email/Password provider ในโปรเจกต์ Firebase
        // (งาน setup ครั้งเดียว ดู shared/README.md ข้อ 8.1)
        throw appError(
          'auth/configuration-not-found',
          'ระบบยังตั้งค่าไม่เสร็จ (ยังไม่ได้เปิดใช้การเข้าสู่ระบบด้วยรหัสผ่านใน Firebase) กรุณาแจ้งแอดมิน'
        );
      default:
        console.error('[auth] signIn error ที่ยังไม่ได้จัดการ:', e?.code, e);
        throw appError('auth/unknown', 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  }

  const profile = await fetchProfile(cred.user.uid);
  if (!profile) {
    // บัญชีมีใน Firebase Auth แต่ไม่มีเอกสารใน Firestore — ข้อมูลไม่สมบูรณ์
    await signOut(auth).catch(() => {});
    throw appError('auth/no-profile', 'ไม่พบข้อมูลบัญชีในระบบ กรุณาติดต่อแอดมิน');
  }

  return { authUser: cred.user, profile };
}

/**
 * ออกจากระบบ
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  await signOut(auth);
}

/**
 * อ่านเอกสารโปรไฟล์ users/{uid}
 * @param {string} uid
 * @returns {Promise<object|null>} `{ uid, username, fullName, role, ... }` หรือ null
 */
export async function fetchProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

/**
 * ติดตามสถานะล็อกอิน พร้อมโปรไฟล์ Firestore
 *
 * callback ถูกเรียกทุกครั้งที่สถานะเปลี่ยน (รวมครั้งแรกที่ Firebase resolve แล้ว)
 * ด้วย `{ authUser, profile }` — ถ้ายังไม่ล็อกอินจะได้ `{ authUser: null, profile: null }`
 *
 * @param {(state: {authUser: object|null, profile: object|null}) => void} callback
 * @returns {() => void} ฟังก์ชันสำหรับยกเลิกการติดตาม (unsubscribe)
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ authUser: null, profile: null });
      return;
    }
    let profile = null;
    try {
      profile = await fetchProfile(user.uid);
    } catch (e) {
      console.error('[auth] อ่านโปรไฟล์ไม่สำเร็จ', e);
    }
    callback({ authUser: user, profile });
  });
}

/**
 * รอจนกว่า Firebase จะ resolve สถานะ auth ครั้งแรก แล้วคืนค่าสถานะนั้น
 * ใช้ภายใน requireRole() และหน้าจอที่อยากรอสถานะแบบ await ตรง ๆ
 * @returns {Promise<{authUser: object|null, profile: object|null}>}
 */
export function waitForAuth() {
  return new Promise((resolve) => {
    const unsub = onAuthChange((state) => {
      unsub();
      resolve(state);
    });
  });
}

/**
 * เปลี่ยนรหัสผ่านของผู้ใช้ที่ล็อกอินอยู่ แล้วปิดธง mustChangePassword
 *
 * @param {string} newPassword รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษรตามข้อกำหนดของ Firebase)
 * @returns {Promise<void>}
 * @throws {Error} ข้อความภาษาไทยพร้อมแสดงผล
 */
export async function changePassword(newPassword) {
  const user = auth.currentUser;
  if (!user) {
    throw appError('auth/not-signed-in', 'ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
  }
  if (!newPassword || String(newPassword).length < 6) {
    throw appError('auth/weak-password', 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
  }

  try {
    await updatePassword(user, newPassword);
  } catch (e) {
    switch (e?.code) {
      case 'auth/weak-password':
        throw appError('auth/weak-password', 'รหัสผ่านใหม่สั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร');
      case 'auth/requires-recent-login':
        throw appError(
          'auth/requires-recent-login',
          'เพื่อความปลอดภัย กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ ก่อนเปลี่ยนรหัสผ่าน'
        );
      case 'auth/network-request-failed':
        throw appError('auth/network-request-failed', 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสอบสัญญาณแล้วลองใหม่');
      default:
        throw appError('auth/unknown', 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  }

  // ปิดธง "ต้องเปลี่ยนรหัสผ่าน" — rules อนุญาตให้เจ้าของเอกสารแก้เฉพาะฟิลด์นี้ฟิลด์เดียว
  try {
    await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: false });
  } catch (e) {
    // รหัสผ่านเปลี่ยนสำเร็จไปแล้ว ถือว่าไม่ critical — แค่ log ไว้
    console.warn('[auth] เปลี่ยนรหัสผ่านสำเร็จ แต่อัปเดต mustChangePassword ไม่สำเร็จ', e);
  }
}

/**
 * หน้าแรกของแต่ละบทบาทหลังล็อกอิน
 * @param {'participant'|'trainer'|'admin'} role
 * @returns {string} ชื่อไฟล์ HTML (path สัมพัทธ์ เพราะทุกหน้าอยู่แบนใน e-token-app/)
 */
export function getRoleHomePage(role) {
  switch (role) {
    case 'admin':
      return 'admin-overview.html';
    case 'trainer':
      return 'grant.html';
    case 'participant':
      return 'participant.html';
    default:
      return 'login.html';
  }
}

/**
 * ยามเฝ้าหน้า — เรียกเป็นสิ่งแรกในทุกหน้าที่ต้องล็อกอิน
 *
 * รอให้ Firebase resolve สถานะ auth ครั้งแรกก่อนเสมอ (ไม่ redirect ทิ้งก่อนเวลา)
 * ถ้าไม่ผ่านเงื่อนไขจะ redirect แล้ว return Promise ที่ "ค้างไว้ตลอดกาล"
 * เพื่อให้โค้ดหลัง `await` ของหน้านั้นไม่ทำงานต่อระหว่างเบราว์เซอร์กำลังเปลี่ยนหน้า
 *
 * ตัวอย่าง:
 *   const { authUser, profile } = await requireRole(['trainer']);
 *
 * @param {string[]} allowedRoles เช่น ['trainer'] หรือ ['trainer','admin']
 * @param {string} [redirectTo='login.html'] หน้าที่จะส่งไปเมื่อไม่ผ่าน
 * @returns {Promise<{authUser: object, profile: object}>}
 */
export async function requireRole(allowedRoles, redirectTo = 'login.html') {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const { authUser, profile } = await waitForAuth();

  // ยังไม่ล็อกอิน หรือไม่มีโปรไฟล์ -> ไปหน้าล็อกอิน
  if (!authUser || !profile) {
    location.replace(redirectTo);
    return new Promise(() => {});
  }

  // ล็อกอินแล้วแต่บทบาทไม่ตรง -> ส่งกลับหน้าแรกของบทบาทตัวเอง (ไม่ใช่หน้าล็อกอิน)
  if (!roles.includes(profile.role)) {
    location.replace(getRoleHomePage(profile.role));
    return new Promise(() => {});
  }

  return { authUser, profile };
}
