/**
 * firebase-init.js — จุดเริ่มต้นเดียวของ Firebase สำหรับทั้งแอป
 * ----------------------------------------------------------------
 * ทุกไฟล์ในแอปนี้ต้อง import `auth` / `db` จากที่นี่เท่านั้น
 * ห้ามเรียก initializeApp() ซ้ำในหน้าอื่น (ยกเว้น secondary app
 * สำหรับสร้างบัญชี ดู createAccount() ใน data.js ซึ่งมีเหตุผลเฉพาะ)
 *
 * Stack: Firebase JS SDK 10.13.2 ผ่าน CDN + native ES modules
 * ไม่มี build step / ไม่มี npm — ต้องเปิดผ่าน static server เช่น
 *   python -m http.server 8000
 * (เปิดด้วย file:// ตรง ๆ ไม่ได้ เพราะ ES module ติด CORS)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

/** base URL ของ SDK — export ไว้ให้หน้าอื่นอ้างเวอร์ชันเดียวกันได้ */
export const FIREBASE_SDK_URL = 'https://www.gstatic.com/firebasejs/10.13.2';

/**
 * firebaseConfig เป็น public client config ไม่ใช่ความลับ
 * (ตัวที่ป้องกันจริงคือ firestore.rules — ดู SCOPE.md หัวข้อ Backend/Auth)
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyB0mRhpz_IjpKcGRR5gRW4f_dqYSY-FF3s',
  authDomain: 'tft-e-token.firebaseapp.com',
  projectId: 'tft-e-token',
  storageBucket: 'tft-e-token.firebasestorage.app',
  messagingSenderId: '165710001101',
  appId: '1:165710001101:web:8b6b1cc5b3abdb50aaca84'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * โดเมนสังเคราะห์สำหรับ map username -> email
 * ผู้ใช้ไม่เคยเห็นและไม่เคยพิมพ์อีเมลนี้ — พิมพ์แค่ username เปล่า ๆ (เช่น tft01)
 * Firebase Auth email/password provider บังคับให้ identifier เป็นรูปอีเมล
 * จึงต้องแปลงแบบ deterministic ตรงนี้ที่เดียว
 */
export const USERNAME_EMAIL_DOMAIN = 'tft-e-token.local';

/**
 * แปลง username -> synthetic email
 * @param {string} username เช่น 'tft01'
 * @returns {string} เช่น 'tft01@tft-e-token.local'
 */
export function usernameToEmail(username) {
  return `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`;
}

/**
 * ทำให้ username เป็นรูปแบบมาตรฐาน (ตัดช่องว่าง + ตัวพิมพ์เล็ก)
 * ใช้ทั้งตอนสร้างบัญชี ตอนล็อกอิน และตอนค้นหาใน Firestore
 * เพื่อให้ค่าที่เก็บกับค่าที่ค้นตรงกันเสมอ
 * @param {string} username
 * @returns {string}
 */
export function normalizeUsername(username) {
  return String(username ?? '').trim().toLowerCase();
}

/** prefix ภายในของ username ทุกบัญชี — ผู้ใช้ไม่เคยพิมพ์/เห็นส่วนนี้เลย (ดู toFullUsername) */
const USERNAME_PREFIX = 'tft';

/**
 * แปลง "รหัสประจำตัวที่ผู้ใช้พิมพ์" (แค่เลข 1-2 หลักท้าย เช่น '7' หรือ '23')
 * ให้เป็น username เต็มรูปแบบที่เก็บจริงใน Firestore/Auth ('tft07', 'tft23')
 *
 * ทุกช่องกรอกรหัสประจำตัวในแอปนี้ (login, แจก, หัก, สร้างบัญชี) ให้ผู้ใช้พิมพ์
 * แค่เลข 2 หลักเท่านั้น — ฟังก์ชันนี้เติม prefix 'tft' + zero-pad ให้เองที่เดียว
 * ก่อนส่งต่อไปให้ signIn() / findUserByUsername() เสมอ ไม่ต้องเขียนซ้ำหลายที่
 *
 * รองรับกรณีพิมพ์มาเต็ม ๆ อยู่แล้วด้วย (idempotent) เผื่อโค้ด/ข้อมูลเก่าหลงเหลืออยู่
 *
 * @param {string|number} shortCode เช่น '23', 23, หรือ 'tft23'
 * @returns {string} เช่น 'tft23' (คืนค่าว่างถ้า input ว่าง)
 */
export function toFullUsername(shortCode) {
  const raw = normalizeUsername(shortCode);
  if (!raw) return raw;
  if (raw.startsWith(USERNAME_PREFIX)) return raw;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;
  return `${USERNAME_PREFIX}${digits.padStart(2, '0')}`;
}

/**
 * ตัด prefix 'tft' ออกจาก username เต็มรูปแบบ คืนแค่เลข 2 หลัก
 * ใช้ตอน**แสดงผล**ให้มนุษย์เห็น (เช่น หน้า UserManagement, สลิปรหัสผ่าน) — ค่าที่เก็บจริง
 * ใน Firestore/Auth ยังเป็น 'tft23' เหมือนเดิมเสมอ ฟังก์ชันนี้ไม่ได้แก้ข้อมูล แค่จัดรูปแบบตอนโชว์
 * @param {string} fullUsername เช่น 'tft23'
 * @returns {string} เช่น '23'
 */
export function toShortCode(fullUsername) {
  const raw = normalizeUsername(fullUsername);
  return raw.startsWith(USERNAME_PREFIX) ? raw.slice(USERNAME_PREFIX.length) : raw;
}
