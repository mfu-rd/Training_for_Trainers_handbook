/**
 * theme.js — สลับโหมดมืด/สว่าง (day/night) ของระบบแจก e-Token TFT
 * ---------------------------------------------------------------
 * ทุกหน้า import ไฟล์นี้ (side-effect เดียว ไม่ต้องเรียกฟังก์ชันเอง):
 *   import './shared/theme.js';
 *
 * ทำงานทันทีตอน import:
 *   1. อ่านค่าที่จำไว้จาก localStorage (มี try/catch กัน origin ที่บล็อก storage
 *      เช่น sandboxed preview — ตามแบบเดียวกับ index.html/auction-app ที่โปรเจกต์นี้ใช้)
 *   2. ใส่ data-theme ให้ <html> ถ้ามีค่าที่จำไว้ (ถ้าไม่มี ปล่อยให้ CSS
 *      @media (prefers-color-scheme) ตัดสินเอง — ค่าเริ่มต้นของระบบนี้คือมืด)
 *   3. หาปุ่ม .theme-toggle-btn ทุกปุ่มในหน้า (เผื่อมีมากกว่า 1 จุดในอนาคต —
 *      ต้องใช้ querySelectorAll ไม่ใช่ getElementById ตาม pattern ที่ตั้งไว้ใน
 *      root DESIGN.md ของโปรเจกต์นี้) ผูก click handler + sync ไอคอนให้ตรงกันหมด
 *
 * key ที่ใช้เก็บ: 'tft-etoken-theme' — จงใจแยกจาก 'tft-theme' ที่ index.html/
 * auction-app ใช้ร่วมกัน เพราะ e-token-app เป็นระบบดีไซน์คนละชุดตาม DESIGN.md
 * (ไม่ควรให้การสลับธีมในเว็บคู่มือหลักไปกระทบแอปนี้โดยไม่ตั้งใจ หรือกลับกัน)
 */

const STORAGE_KEY = 'tft-etoken-theme';

function readStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function writeStoredTheme(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    // origin บล็อก storage (เช่น sandboxed preview) — ใช้งานต่อได้ปกติ แค่ไม่จำค่าข้ามเซสชัน
  }
}

function currentTheme() {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit) return explicit;
  // ไม่มีการตั้งค่าเอง — ระบบนี้ค่าเริ่มต้นคือธีมมืด เว้นแต่เครื่องเลือก "สว่าง" ไว้ชัดเจน
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function syncButtons() {
  const theme = currentTheme();
  const icon = theme === 'light' ? '🌙' : '☀️'; // ไอคอนคือโหมดที่ "จะสลับไป" ถ้ากด
  document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
    btn.textContent = icon;
  });
}

const saved = readStoredTheme();
if (saved) {
  document.documentElement.setAttribute('data-theme', saved);
}

document.addEventListener('DOMContentLoaded', () => {
  syncButtons();
  document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      writeStoredTheme(next);
      syncButtons();
    });
  });
});
