# คู่มือชั้นฐาน (Foundation) — ระบบแจก e-Token TFT

เอกสารนี้คือ **สัญญาการใช้งาน** ระหว่างชั้นฐาน (เฟส 1) กับหน้าจอทั้ง 10 หน้าที่จะสร้างต่อในเฟส 2
อ่านให้จบก่อนเขียนหน้าจอ — ทุกอย่างที่คุณต้องใช้มีอยู่แล้ว ไม่ต้องเขียน Firebase logic เองใหม่

เอกสารที่ต้องอ่านคู่กัน:
- `e-token-app/DESIGN.md` — ระบบดีไซน์ (บังคับทุกการตัดสินใจด้านภาพ)
- `SPEC.md` (root) — หน้าจอ + โครงสร้างข้อมูล Firestore
- `SCOPE.md` (root) — ขอบเขตงานและเหตุผลเบื้องหลัง

---

## 1. สิ่งที่มีอยู่แล้ว (เฟส 1 ทำเสร็จแล้ว)

```
e-token-app/
├── login.html              ← เสร็จแล้ว ห้ามสร้างซ้ำ
├── change-password.html    ← เสร็จแล้ว ห้ามสร้างซ้ำ
├── firestore.rules         ← กฎความปลอดภัย (ยังไม่ deploy ดูข้อ 8)
├── PRODUCT.md
├── DESIGN.md
└── shared/
    ├── firebase-init.js    ← ต่อ Firebase (auth, db)
    ├── auth.js             ← ล็อกอิน / สิทธิ์ / เปลี่ยนรหัสผ่าน
    ├── data.js             ← อ่าน-เขียนยอด token ทั้งหมด (transaction-safe)
    ├── styles.css          ← ระบบดีไซน์ทั้งหมด
    └── README.md           ← ไฟล์นี้
```

## 2. ชื่อไฟล์ที่ต้องสร้าง (ห้ามตั้งชื่ออื่น)

ทุกหน้าอยู่**แบนราบใน `e-token-app/`** ไม่มีโฟลเดอร์ย่อย เพราะ `getRoleHomePage()` และลิงก์ nav อ้างชื่อเหล่านี้ตรง ๆ

| ไฟล์ | หน้าจอใน SPEC.md | บทบาทที่เข้าได้ | สีประจำหน้า |
|---|---|---|---|
| `participant.html` | ParticipantDashboard | participant | mint (+ ตกแต่ง sun-decor ได้เฉพาะหน้านี้) |
| `grant.html` | GrantToken | trainer | mint |
| `trainer-history.html` | TrainerHistory | trainer | mint |
| `deduct.html` | DeductToken | admin | danger |
| `transactions.html` | TransactionEditor | admin | pink (ปุ่มยกเลิกรายการใช้ danger) |
| `export.html` | ExportData | admin | pink |
| `admin-overview.html` | AdminOverview | admin | pink |
| `trainer-quota.html` | TrainerQuotaSettings | admin | pink (ช่องโควตา/แถบโควตาใช้ amber) |
| `user-management.html` | UserManagement | admin | pink |

> `getRoleHomePage()` ส่ง participant → `participant.html`, trainer → `grant.html`, admin → `admin-overview.html`

## 3. โครงหน้า HTML มาตรฐาน (คัดลอกไปใช้ได้เลย)

```html
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>แจก Token — ระบบแจก e-Token TFT</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./shared/styles.css">
</head>
<body class="accent-grant">   <!-- สีประจำหน้า ดูตารางข้อ 2 -->

<main class="layout-form">    <!-- หรือ .layout-data สำหรับหน้าตาราง -->
  ...
</main>

<script type="module">
import { requireRole, signOutUser } from './shared/auth.js';
import { grantToken } from './shared/data.js';

// บรรทัดแรกเสมอ — กันคนที่ไม่มีสิทธิ์ และรอ Firebase resolve auth ให้เรียบร้อยก่อน
const { authUser, profile } = await requireRole(['trainer']);
// ...โค้ดหน้าจอ
</script>
</body>
</html>
```

กฎการ import:
- ทุกหน้าอยู่ระดับเดียวกับโฟลเดอร์ `shared/` → path คือ `./shared/xxx.js` เสมอ
- ต้องเป็น `<script type="module">` เท่านั้น (ใช้ `import` และ top-level `await` ได้)
- **ต้องเปิดผ่าน static server** เช่น `python -m http.server 8000` แล้วเข้า
  `http://localhost:8000/e-token-app/login.html` — เปิดด้วย `file://` ตรง ๆ จะพังเพราะ ES module ติด CORS

---

## 4. `shared/auth.js` — ฟังก์ชันที่ export

| ฟังก์ชัน | signature | ทำอะไร |
|---|---|---|
| `signIn` | `(username, password) => Promise<{authUser, profile}>` | แปลง username → synthetic email แล้วล็อกอิน; throw `Error` ข้อความไทยพร้อมแสดงผล (ไม่บอกว่าผิดที่ username หรือ password) |
| `signOutUser` | `() => Promise<void>` | ออกจากระบบ |
| `onAuthChange` | `(cb) => unsubscribe` | เรียก `cb({authUser, profile})` ทุกครั้งที่สถานะเปลี่ยน; ยังไม่ล็อกอิน = `{authUser:null, profile:null}` |
| `waitForAuth` | `() => Promise<{authUser, profile}>` | รอสถานะ auth ครั้งแรกแบบ await ครั้งเดียว |
| `fetchProfile` | `(uid) => Promise<object\|null>` | อ่าน `users/{uid}` คืน `{uid, ...data}` |
| `changePassword` | `(newPassword) => Promise<void>` | เปลี่ยนรหัสผ่านของคนที่ล็อกอินอยู่ + ตั้ง `mustChangePassword:false` |
| `requireRole` | `(allowedRoles, redirectTo='login.html') => Promise<{authUser, profile}>` | ยามเฝ้าหน้า รอ auth resolve ก่อนเสมอ |
| `getRoleHomePage` | `(role) => string` | `'participant.html'` / `'grant.html'` / `'admin-overview.html'` |

**พฤติกรรมของ `requireRole` ที่ต้องรู้:**
- ยังไม่ล็อกอิน → `location.replace('login.html')`
- ล็อกอินแล้วแต่บทบาทไม่ตรง → ส่งกลับ**หน้าแรกของบทบาทตัวเอง** (ไม่ใช่หน้าล็อกอิน) เพื่อไม่ให้ผู้ใช้ติดลูป
- กรณีที่ไม่ผ่าน Promise จะ **ไม่ resolve เลย** (ค้างไว้ตั้งใจ) เพื่อไม่ให้โค้ดหลัง `await` ทำงานระหว่างเบราว์เซอร์กำลังเปลี่ยนหน้า → เขียนโค้ดต่อจาก `await requireRole(...)` ได้อย่างปลอดภัย

**เรื่อง username / email สังเคราะห์:** ผู้ใช้พิมพ์แค่ `tft01` ระบบแปลงเป็น `tft01@tft-e-token.local` ภายใน
**ห้ามแสดงอีเมลนี้ใน UI เด็ดขาด** (ยกเว้นหน้าจอคำแนะนำรีเซ็ตรหัสผ่าน ดูข้อ 6)

---

## 5. `shared/data.js` — ฟังก์ชันที่ export

ทุกฟังก์ชันที่เปลี่ยนยอดทำงานใน `runTransaction` เดียว — แจก/หัก/ยกเลิก จะไม่มีทางเขียนสำเร็จแค่ครึ่งเดียว
error ทุกตัวเป็น `Error` ที่มีข้อความภาษาไทยพร้อมแสดงผล + มี `.code` ให้แยกเคสได้

### อ่านข้อมูล
| ฟังก์ชัน | signature | หมายเหตุ |
|---|---|---|
| `findUserByUsername` | `(username) => Promise<{uid,...}\|null>` | ค้นด้วย query จริง ไม่ใช่ดึงทั้ง collection |
| `listAllUsers` | `() => Promise<object[]>` | เรียงตาม username |
| `listTransactionsByActor` | `(actorUid, max=100) => Promise<object[]>` | รายการที่คนนี้เป็นผู้ทำ → **TrainerHistory** |
| `listTransactionsByTarget` | `(targetUid, max=100) => Promise<object[]>` | รายการที่กระทบยอดคนนี้ → **ParticipantDashboard** |
| `listAllTransactions` | `(max=500) => Promise<object[]>` | แอดมินเท่านั้น → **TransactionEditor / ExportData** |
| `getTransaction` | `(id) => Promise<object\|null>` | |
| `formatTimestamp` | `(ts) => string` | แปลง Firestore Timestamp → ข้อความไทยอ่านง่าย |

ทุกลิสต์เรียง `createdAt` ใหม่→เก่า และคืน `{ id, ...data }`

> ⚠️ **Composite index:** query ที่มี `where` + `orderBy` ต้องมี index
> ครั้งแรกที่รัน Firestore จะโยน error พร้อม **ลิงก์สร้าง index** มาที่ console ของเบราว์เซอร์
> เปิดลิงก์นั้นกดสร้างหนึ่งครั้ง (รอ ~1 นาที) แล้วใช้ได้ตลอด — ต้องทำ 2 ตัว:
> `transactions: actorUid ASC + createdAt DESC` และ `transactions: targetUid ASC + createdAt DESC`
> **ให้เผื่อ UI สำหรับ error นี้ด้วย** (แสดงข้อความ "กำลังเตรียมระบบ" ไม่ใช่จอขาว)

### เปลี่ยนยอด
| ฟังก์ชัน | signature | สรุป |
|---|---|---|
| `grantToken` | `({actorUid, targetUsername, amount, reason, reasonSource}) => Promise<txId>` | ตรวจโควตา → ลดโควตาผู้แจก → เพิ่มยอดผู้รับ → บันทึกรายการ ใน transaction เดียว |
| `deductToken` | `({actorUid, targetUsername, amount, itemLabel}) => Promise<txId>` | ตรวจยอด → ลดยอด → บันทึกรายการ |
| `adjustQuota` | `({actorUid, trainerUid, newQuota}) => Promise<txId>` | ตั้งโควตาเป็นค่าใหม่ + log |
| `voidTransaction` | `({actorUid, transactionId, voidReason}) => Promise<void>` | ยกเลิก + **ย้อนผลต่อยอด** |

รายละเอียดที่ต้องออกแบบ UI รองรับ:

- **`grantToken`** — `reasonSource` เป็น `'preset'` (กดปุ่มลัด "ตอบคำถาม"/"ร่วมกิจกรรม") หรือ `'custom'` (พิมพ์เอง)
  โยน error `data/quota-exceeded` ข้อความ `โควตาไม่พอ — คงเหลือ X token แต่ต้องการแจก Y token`
  และ `data/target-not-found` เมื่อไม่มีรหัสประจำตัวนั้น → แสดงข้อความใต้ช่องกรอกได้เลย
  แจกให้ตัวเองไม่ได้ (`data/self-grant`)

- **`deductToken`** — โยน `data/insufficient-balance` ข้อความ `ยอดไม่พอ — ...`

- **`adjustQuota`** — **เก็บ `amount` เป็น "ค่าโควตาใหม่" (ค่าสัมบูรณ์) ไม่ใช่ส่วนต่าง**
  และเก็บ `previousQuota` เพิ่มไว้ด้วย → ในหน้าประวัติต้องแสดงว่า **"ตั้งโควตาเป็น N"** ห้ามแสดงเป็น `+N`

- **`voidTransaction`** —
  - ยกเลิก `grant` → ลดยอดผู้รับกลับ **และคืนโควตาให้วิทยากรผู้แจก**
  - ยกเลิก `deduct` → คืนยอดให้ผู้ถูกหัก
  - ยกเลิกซ้ำไม่ได้ (`data/already-voided`)
  - **`quotaAdjust` ยกเลิกไม่ได้** (`data/cannot-void-quota-adjust`) เพราะค่าที่เก็บเป็นค่าสัมบูรณ์ การย้อนกลับกำกวม
    → ใน TransactionEditor ให้ **ซ่อน/ปิดปุ่มยกเลิกของแถว `quotaAdjust`** พร้อมบอกให้ไปตั้งค่าใหม่ที่ `trainer-quota.html`
  - ถ้ายอดผู้รับตอนนี้น้อยกว่าจำนวนที่ต้องเรียกคืน จะยกเลิกไม่ได้ (`data/insufficient-balance`) — ต้องแสดงข้อความนี้ให้แอดมินเห็น

### จัดการบัญชี + export
| ฟังก์ชัน | signature | สรุป |
|---|---|---|
| `createAccount` | `({username, fullName, role, tempPassword}) => Promise<{uid, username}>` | สร้างทั้งบัญชี Auth และเอกสาร `users/{uid}` |
| `resetPassword` | `({username, newTempPassword}) => Promise<never>` | **throw `NOT_IMPLEMENTED` เสมอ — ดูข้อ 6** |
| `generateTempPassword` | `() => string` | สุ่มตัวเลข 6 หลัก |
| `exportAllDataAsCSV` | `() => Promise<{usersCsv, transactionsCsv, generatedAt}>` | **คืน CSV สองสตริง** แยก users กับ transactions (มี BOM ให้แล้ว Excel ไทยไม่เพี้ยน) |
| `downloadCsv` | `(filename, csvString) => void` | ตัวช่วยดาวน์โหลดไฟล์ |

`createAccount` ตั้งค่าเริ่มต้นให้อัตโนมัติ: participant → `tokenBalance: 0`, trainer → `tokenQuota: 50`, ทุกบทบาท → `mustChangePassword: true`

> 🔒 **เหตุผลที่ `createAccount` สร้าง Firebase app ตัวที่สอง (ห้ามแก้ให้ "ง่ายขึ้น")**
> ถ้าเรียก `createUserWithEmailAndPassword` บน `auth` ตัวหลัก Firebase จะสลับ session
> ไปเป็นบัญชีที่เพิ่งสร้างทันที = **แอดมินหลุดออกจากระบบกลายเป็นบัญชีใหม่**
> โค้ดจึงสร้าง app ชื่อ `'accountCreator'` แยก สร้างบัญชีบนนั้น แล้ว `signOut` + `deleteApp` ทิ้ง
> session ของแอดมินไม่ถูกแตะเลย — ถ้าเห็นโค้ดนี้แล้วคิดว่า "เขียนยืดยาวเกินไป" อย่าแก้

---

## 6. ⚠️ ช่องโหว่ที่รู้อยู่แล้ว: รีเซ็ตรหัสผ่านให้คนอื่น **ทำไม่ได้**

**นี่ไม่ใช่เรื่องยังไม่ได้เขียนโค้ด แต่เป็นข้อจำกัดจริงของ Firebase**

Firebase Auth **client SDK ตั้งรหัสผ่านให้บัญชีคนอื่นไม่ได้เลย** — `updatePassword()` ใช้ได้เฉพาะกับผู้ใช้ที่ล็อกอินอยู่
การรีเซ็ตให้คนอื่นต้องใช้ **Firebase Admin SDK หรือ Cloud Functions** ซึ่งอยู่นอกขอบเขตของโปรเจกต์นี้
(สแตกตัดสินใจไว้แล้วว่าเป็น static ไม่มี build step ไม่มีเซิร์ฟเวอร์ — PRODUCT.md > Stack)
เทคนิค secondary app ที่ใช้ใน `createAccount` **ช่วยเรื่องนี้ไม่ได้** เพราะมันแค่กัน session โดนสลับ ไม่ได้ให้สิทธิ์แก้บัญชีคนอื่น

`resetPassword()` จึง **throw `Error` ที่มี `code === 'NOT_IMPLEMENTED'` เสมอ** พร้อมข้อความไทยบอกขั้นตอนทำมือ

**สิ่งที่ `user-management.html` ต้องทำ:** ปุ่ม "รีเซ็ตรหัสผ่าน" ต้อง **แสดงคำแนะนำ ไม่ใช่กดแล้วเงียบ**
แนะนำให้ทำแบบนี้:

```js
const newPass = generateTempPassword();
try {
  await resetPassword({ username: u.username, newTempPassword: newPass });
} catch (e) {
  if (e.code === 'NOT_IMPLEMENTED') {
    showInstructionModal(e.message); // ข้อความไทยพร้อมใช้ มีขั้นตอนครบอยู่แล้ว
  } else { showError(e.message); }
}
```

ขั้นตอนที่แอดมินต้องทำเองตอนนี้: Firebase Console → Authentication → Users → ค้นหา `<username>@tft-e-token.local` → Reset password → แจ้งรหัสใหม่ให้ผู้ใช้ด้วยตนเอง

---

## 7. `shared/styles.css` — คลาสที่ใช้ได้ทั้งหมด

ใส่ `<link rel="stylesheet" href="./shared/styles.css">` ไฟล์เดียวพอ (ไฟล์ `@import` Kanit ให้แล้ว
แต่แนะนำให้ใส่ `<link>` preconnect + Kanit ใน `<head>` ด้วยเพื่อความเร็ว — ดูโครงหน้าข้อ 3)

### สีประจำหน้า (ใส่ที่ `<body>`)
`accent-grant` / `accent-deduct` / `accent-quota` / `accent-admin`
คลาสนี้ตั้งตัวแปร `--accent`, `--accent-lit`, `--accent-ink` ทำให้ **focus ring, ปุ่มลัด, ข้อความสำเร็จ**
ใช้สีของหน้านั้นเองอัตโนมัติ — ไม่ต้องเขียน CSS เพิ่มเอง

### Layout
| คลาส | ใช้เมื่อ |
|---|---|
| `.layout-form` | คอลัมน์กลาง 720px — หน้าฟอร์ม (grant, deduct, login, change-password, user-management) |
| `.layout-data` | คอลัมน์กลาง 1100px — หน้าตาราง (admin-overview, transactions, trainer-history, export, trainer-quota) |
| `.stack` / `.stack-sm` | เว้นระยะแนวตั้งระหว่างลูก (24px / 12px) |
| `.action-isolated` | เว้น 48px เหนือปุ่มหลัก ให้ปุ่มยืนโดดเดี่ยวตาม DESIGN.md |
| `.row` `.row-between` `.grow` `.text-right` `.hidden` `.sr-only` | utility ทั่วไป |

### ตัวอักษร
`.display` · `.headline` · `.label` (eyebrow ตัวพิมพ์ใหญ่ letter-spacing กว้าง) · `.body` · `.muted`
`.display-numeral` — ตัวเลขยอดใหญ่สี mint (participant.html)
`.num` — ตัวเลขเรียงหลักตรงกัน (tabular figures) ใช้ในตาราง
`.tick-bump` — คลาสอนิเมชัน Balance Tick: เติมคลาสนี้แล้วถอดออกเมื่อยอดเปลี่ยน
**ใช้ได้เฉพาะ `participant.html`** (DESIGN.md: motion อยู่หน้านี้หน้าเดียว หน้าอื่นใช้ข้อความ inline แทน)

### ปุ่ม
`.btn` (ปุ่มรอง/ยกเลิก/ย้อนกลับ) · `.btn-grant` (mint) · `.btn-deduct` (danger) · `.btn-admin` (pink) · `.btn-block` (เต็มความกว้าง)
สถานะ disabled ทำงานอัตโนมัติผ่าน attribute `disabled` (opacity 40% ไม่มี hover)
ใช้ `.btn .btn-grant` คู่กันเสมอ เช่น `<button class="btn btn-grant">`

### การ์ด / ป้าย
`.card` (มุม 20px พื้น card-plum เส้น hairline ไม่มีเงา) · `.card-tight` (padding เล็กลง) · `.card-row`
`.pill` + `.pill-grant` (แจก) / `.pill-deduct` (หัก) / `.pill-admin` (ปรับโควตา) / `.pill-quota` / `.pill-voided` (ขีดฆ่า)

### แถบโควตา (คอมโพเนนต์ลายเซ็น)
```html
<div class="quota-bar">
  <div class="quota-bar-head">
    <span class="label">โควตาคงเหลือ</span>
    <span class="quota-bar-value num">32 / 50</span>
  </div>
  <div class="quota-bar-track"><div class="quota-bar-fill" style="width:64%"></div></div>
</div>
<!-- เมื่อเหลือ < 20% ให้แสดงกล่องเตือนเส้นประนี้ต่อท้าย -->
<div class="quota-warning">โควตาใกล้หมด — เหลือ 7 token</div>
```
แถบนี้ **เป็น amber เสมอ ห้ามเปลี่ยนเป็น danger ตอนใกล้หมด** (โควตาใกล้หมด = คำเตือน ไม่ใช่การหักยอด)

### ฟอร์ม
`.field` (wrapper) · `.label` (ป้ายเหนือช่อง) · `.input` (ใช้กับ input/select/textarea) · `.hint` (ข้อความช่วยใต้ช่อง)
ปุ่มลัดเลือกจำนวน/เหตุผล: `.pick-row` ครอบ `.pick` — ใส่ `.selected` หรือ `aria-pressed="true"` เมื่อเลือก
```html
<div class="pick-row">
  <button type="button" class="pick selected">1</button>
  <button type="button" class="pick">3</button>
  <button type="button" class="pick">ระบุเอง</button>
</div>
```

### ข้อความแจ้งผล
`.msg` + `.msg-ok` (สีประจำหน้า) / `.msg-error` / `.msg-warn` (amber)
`.msg:empty` ซ่อนตัวเองอัตโนมัติ → เซ็ต `textContent = ''` เพื่อเคลียร์ได้เลย

### ตาราง
```html
<div class="table-wrap">
  <table class="table">
    <thead><tr><th>วันเวลา</th><th class="col-num">จำนวน</th></tr></thead>
    <tbody><tr class="is-voided"><td>...</td><td class="col-num num">5</td></tr></tbody>
  </table>
</div>
```
`.col-num` = ชิดขวา + tabular figures · `.is-voided` = ทั้งแถวจางลง

### อื่น ๆ
`.appbar` + `.brand` + `.nav-chips` + `.nav-chip` (+`.active` = pink เสมอ ไม่ว่าหน้านั้นสีอะไร)
`.empty` (สถานะไม่มีข้อมูล) · `.loading`

### หมายเหตุเรื่องสี (การตีความที่ต้องรู้)
DESIGN.md ไม่ได้กำหนดสี "ข้อความผิดพลาด" ไว้ และห้ามคิดสีใหม่ขึ้นมาเอง
`styles.css` จึงใช้ **danger** กับ `.msg-error` — เป็นข้อความ ไม่ใช่ปุ่ม/affordance จึงไม่ขัดกับกฎ One Color One Meaning
**อย่าเพิ่มสีแดง `#ef4444` หรือสีใหม่ใด ๆ เข้ามา** ถ้าต้องการโทน "เตือน" ให้ใช้ `.msg-warn` (amber)

---

## 8. งานตั้งค่า Firebase ที่ยังค้างอยู่ (ต้องทำก่อนใช้งานจริง)

### 8.1 ⚠️ ยังไม่ได้เปิดใช้ Email/Password provider

**ตรวจสอบจริงแล้วเมื่อสร้างชั้นฐานนี้:** โปรเจกต์ `tft-e-token` ตอบกลับ `auth/configuration-not-found`
แปลว่า **ยังไม่ได้เปิดใช้ Firebase Authentication / ยังไม่ได้เปิด provider แบบ Email/Password**
ทุกการล็อกอินจะล้มเหลวจนกว่าจะทำขั้นตอนนี้ (เป็นงานตั้งค่าครั้งเดียว ไม่ใช่บั๊กในโค้ด)

> Firebase Console → โปรเจกต์ `tft-e-token` → Authentication → Get started →
> Sign-in method → **Email/Password → Enable → Save**

`signIn()` ดักเคสนี้ไว้แล้ว และคืนข้อความไทยว่า *"ระบบยังตั้งค่าไม่เสร็จ ... กรุณาแจ้งแอดมิน"*
(code `auth/configuration-not-found`) — ถ้าทดสอบแล้วเจอข้อความนี้ **ไม่ต้องไปไล่แก้โค้ด** ให้ไปเปิด provider ก่อน

### 8.2 ยังไม่มีบัญชีใด ๆ ในระบบ

ยังไม่มีบัญชี admin ตัวแรก และ `createAccount()` ต้องล็อกอินเป็น admin อยู่ก่อนถึงจะใช้ได้ (กฎบังคับ)
→ **บัญชี admin ตัวแรกต้องสร้างด้วยมือ:** Firebase Console → Authentication → Add user
(อีเมล `tft00@tft-e-token.local` + รหัสผ่าน) แล้วไป Firestore สร้างเอกสาร `users/{uid ของบัญชีนั้น}`
ด้วยฟิลด์ `username: 'tft00'`, `fullName`, `role: 'admin'`, `mustChangePassword: true`
จากนั้นบัญชีที่เหลือ (`tft01`–`tft80`) สร้างผ่านหน้า `user-management.html` ได้ตามปกติ

### 8.3 `firestore.rules` — ยังไม่ได้ deploy

ไฟล์ `e-token-app/firestore.rules` เขียนเสร็จแล้วแต่ **ยังไม่ถูก deploy ขึ้น Firebase**
ต้อง deploy ด้วยมือก่อนใช้งานจริง:
```
firebase deploy --only firestore:rules
```
(หรือคัดลอกเนื้อไฟล์ไปวางใน Firebase Console → Firestore Database → Rules → Publish)

สรุปสิ่งที่กฎอนุญาต:
- `users`: อ่านได้ถ้าเป็นเจ้าของ หรือเป็น trainer/admin · สร้างได้เฉพาะ admin ·
  trainer ลดโควตาตัวเองได้อย่างเดียว / เพิ่ม `tokenBalance` ให้คนอื่นได้อย่างเดียว ·
  ทุกคนปิด `mustChangePassword` ของตัวเองได้ · **participant แก้ `tokenBalance`/`tokenQuota`/`role` ของตัวเองไม่ได้เด็ดขาด**
- `transactions`: อ่านได้ถ้าเกี่ยวข้องกับตัวเอง หรือเป็น admin · trainer สร้างได้เฉพาะ `grant` · admin สร้าง `deduct`/`quotaAdjust` ·
  แก้ไขได้เฉพาะ admin และเฉพาะการยกเลิก (`active → voided` แตะได้แค่ 4 ฟิลด์ของการยกเลิก) · **ลบไม่ได้ทุกกรณี**

> **ขอบเขตของการป้องกัน (ต้องรู้ อย่าเข้าใจผิดว่ากันได้ทุกอย่าง):**
> กฎชุดนี้เป็น defense-in-depth แบบ "best effort" — บังคับได้แค่ว่า *ใครแก้ฟิลด์ไหนได้* และ *ทิศทางของยอดถูกต้องไหม*
> แต่บังคับไม่ได้ว่า "รายการ grant ใบนี้เพิ่มยอดตรงกับ `amount` ที่บันทึกจริงหรือเปล่า"
> ความถูกต้องระดับนั้นอาศัยการที่วิทยากร/แอดมินรันฟังก์ชันใน `shared/data.js` ที่ตรวจและทำงานเป็น transaction เดียว
> การบังคับฝั่งเซิร์ฟเวอร์เต็มรูปแบบต้องใช้ Cloud Functions ซึ่งอยู่นอกขอบเขตของสแตกนี้ —
> ความเสี่ยงที่เหลือคือ "วิทยากร/แอดมินที่มีบัญชีจริงและตั้งใจโกงผ่าน console" ซึ่งยอมรับได้ในบริบทเครื่องมือภายในทีมงานเล็ก ๆ ที่มี audit trail ครบ
> **อย่าเขียนใน UI ว่าระบบ "ปลอดภัย 100%"**

---

## 9. โครงสร้างข้อมูล (สรุปสั้น — ฉบับเต็มใน SPEC.md)

```
users/{uid}
  username: 'tft01'        fullName: 'ชื่อ นามสกุล'
  role: 'participant'|'trainer'|'admin'
  tokenBalance: number     // participant เท่านั้น
  tokenQuota: number       // trainer เท่านั้น (เริ่ม 50)
  mustChangePassword: bool
  createdAt: timestamp

transactions/{id}
  type: 'grant'|'deduct'|'quotaAdjust'
  actorUid, targetUid (ไม่มีใน quotaAdjust), trainerUid (เฉพาะ quotaAdjust)
  amount: number           // เป็นบวกเสมอ ทิศทางดูจาก type
                           // quotaAdjust: amount = โควตาใหม่ (ค่าสัมบูรณ์) + มี previousQuota
  reason, reasonSource ('preset'|'custom')   // grant
  itemLabel                                  // deduct
  status: 'active'|'voided'
  voidedBy, voidedAt, voidReason
  createdAt: timestamp
```

## 10. เช็กลิสต์ก่อนส่งงานหน้าจอของคุณ

- [ ] บรรทัดแรกของสคริปต์คือ `await requireRole([...])`
- [ ] `<body>` มีคลาส `accent-*` ตรงกับตารางข้อ 2
- [ ] ใช้แต่คลาสจาก `styles.css` ไม่เขียนสี hex ใหม่ใน `<style>` ของหน้า
- [ ] ไม่มี sun-decor / gradient / confetti นอก `participant.html`
- [ ] ปุ่มทำลาย (หัก/ยกเลิก) เป็น danger เท่านั้น ปุ่มแจกเป็น mint เท่านั้น
- [ ] มีปุ่ม/ลิงก์ออกจากระบบ (`signOutUser()` แล้ว `location.replace('login.html')`)
- [ ] แสดง error จาก data.js ด้วย `err.message` ตรง ๆ ได้เลย (เป็นภาษาไทยพร้อมใช้แล้ว)
- [ ] สถานะว่าง/กำลังโหลด/ออฟไลน์ มี UI รองรับ (ห้องบรรยายเน็ตไม่แน่นอน — SCOPE.md)
- [ ] ทดสอบด้วย `python -m http.server` ไม่ใช่เปิดไฟล์ตรง ๆ
