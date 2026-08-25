# TFT Handbook — Design System

## Overview
ระบบดีไซน์สำหรับคู่มือกิจกรรม Training for the Trainers (TFT) เน้นการอ่านสบาย ข้อมูลเป็นหมวดหมู่ชัดเจน (เตรียมตัว / กำหนดการ / ประกาศ / ติดต่อ) ปรับจากแนว Red Broadcast โดยเน้น **ความโค้งมนของทุกองค์ประกอบ** (การ์ด ปุ่ม ป้าย ตาราง) ให้ความรู้สึกเป็นมิตร ไม่แข็งกระด้าง และใช้ **ฟอนต์ Prompt ทั้งหมด** เพื่อรองรับภาษาไทยโดยเฉพาะ สีแดงยังคงเป็นสีเน้น (accent) แต่ใช้อย่างประหยัด เฉพาะจุดที่ต้องการดึงความสนใจ เช่น badge "ด่วน" หรือ deadline

## Colors
- **Primary** (#FF0000): ปุ่ม CTA หลัก, badge ด่วน/deadline, ตัวเน้นสำคัญ — ใช้ประหยัด
- **Primary Hover** (#CC0000): hover state ของปุ่ม/ลิงก์สีแดง
- **Secondary** (#065FD4): ลิงก์ในเนื้อหา, ลิงก์อ้างอิงข้ามหน้า
- **Neutral** (#606060): ข้อความรอง, ไอคอน
- **Background** (#FFFFFF): พื้นหลังหลัก (light mode)
- **Surface** (#F2F2F2): พื้นหลังการ์ด/chip/แถบหัวข้อ
- **Text Primary** (#0F0F0F): หัวข้อ, ชื่อหมวด, เนื้อหาหลัก
- **Text Secondary** (#606060): วันที่, สถานที่, metadata
- **Border** (#E5E5E5): เส้นแบ่งตาราง, ขอบการ์ด (ใช้เบามาก)
- **Success** (#2BA640): สถานะ "อัปเดตแล้ว" / "เติมข้อมูลแล้ว"
- **Warning** (#FB8C00): สถานะ "รอข้อมูล" / ⏳
- **Error / Urgent** (#FF0000): ประกาศด่วน, การเปลี่ยนแปลงกะทันหัน

### Dark mode
- Background → #111111, Surface → #1E1E1E, Text Primary → #F2F2F2, Text Secondary → #A0A0A0, Border → rgba(255,255,255,0.08)
- Card background → `rgba(255,255,255,0.19)` (ขาวโปร่งใส แยกต่างหากจาก Surface — ใช้เฉพาะ `.card`; chip/thead ยังใช้ Surface ทึบตามเดิม)

## Typography
- **ฟอนต์เดียวทั้งเว็บ: Prompt** (Google Fonts) — น้ำหนักที่ใช้: 300, 400, 500, 600, 700

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```
```css
:root { font-family: 'Prompt', sans-serif; }
```

- **Page Title**: Prompt 28px/36px, weight 700
- **Section Title**: Prompt 22px/30px, weight 600
- **Card Title**: Prompt 16px/24px, weight 600
- **Body**: Prompt 15px/24px, weight 400
- **Body Small**: Prompt 13px/20px, weight 400
- **Metadata** (วันที่/เวลา/สถานที่): Prompt 13px/18px, weight 400, สี Text Secondary
- **Label / Badge**: Prompt 12px/16px, weight 500, tracking 0.02em
- **Button Text**: Prompt 15px/20px, weight 500
- **Table Text**: Prompt 14px/22px, weight 400 (หัวตาราง weight 600)

## Elevation
- **Level 0**: flat ไม่มีเงา — พื้นหลังทั่วไป, แถวตาราง
- **Level 1**: `0 1px 3px rgba(0,0,0,0.08)` — การ์ดเนื้อหาปกติ (agenda card, announcement card)
- **Level 2**: `0 8px 24px rgba(0,0,0,0.12)` — dropdown, sticky header ตอน scroll
- **Level 3**: `0 16px 48px rgba(0,0,0,0.2)` — modal, dialog (ถ้ามีในอนาคต)
- Dark mode: ใช้ `border: 1px solid rgba(255,255,255,0.08)` แทนเงาเป็นหลัก

## Components

- **Buttons**
  - Primary: พื้น #0F0F0F (หรือ Primary red สำหรับ CTA เร่งด่วน), ตัวอักษรขาว, สูง 44px, padding แนวนอน 20px, **border-radius 9999px (pill เต็ม)**, Prompt 15px weight 500
  - Outline: ขอบ 1.5px #E5E5E5, ตัวอักษร #0F0F0F, พื้นโปร่งใส, radius 9999px, hover เติมพื้น Surface
  - Icon button: วงกลม 40px, โปร่งใส, hover พื้น Surface

- **Cards** (agenda session, announcement, info block)
  - **border-radius 24px** (โค้งมนชัดเจน, เพิ่มจากต้นแบบ), padding 20–24px, Elevation Level 1, ไม่ใช้ขอบเส้นถ้ามีเงาอยู่แล้ว
  - หัวการ์ด: badge เวลา/หมวด ด้านบน + หัวข้อ + metadata (วิทยากร/สถานที่) ด้านล่าง

- **Badges / Tags**
  - **border-radius 9999px** เต็มวงกลม, padding 4px/12px, Prompt 12px weight 500
  - สถานะ: "รอข้อมูล" (Warning, พื้นเหลืองอ่อน), "อัปเดตแล้ว" (Success, พื้นเขียวอ่อน), "ด่วน" (Error, พื้นแดงอ่อน ตัวอักษรแดง)

- **Chips** (ตัวเลือกวัน: วันที่ 1–5, หมวดกำหนดการ)
  - Pill เต็ม (9999px), พื้น Surface, ตัวอักษร Text Primary
  - Selected: พื้น #0F0F0F ตัวอักษรขาว (หรือพื้น Primary แดงอ่อนถ้าต้องการเน้น)
  - แถบ chip เลื่อนแนวนอนได้บนมือถือ

- **Checklist** (สิ่งที่ต้องเตรียม)
  - กล่องติ๊ก 20px, **border-radius 8px** (ไม่ใช่สี่เหลี่ยมคม), border 2px #606060 เมื่อยังไม่ติ๊ก, พื้น Success เมื่อติ๊กแล้ว พร้อมเครื่องหมายถูกสีขาว

- **Tables** (กำหนดการ, ข้อมูลติดต่อ)
  - ไม่มีเส้นตารางเต็มรูปแบบ — ใช้เส้นบาง 1px Border คั่นเฉพาะแนวนอน
  - แถวหัวตาราง: พื้น Surface, ตัวอักษร weight 600, **มุมบนโค้ง 16px** ให้เข้าธีมโค้งมน
  - hover แถว: พื้น Surface อ่อน ๆ
  - บนมือถือ: ห่อ container `overflow-x: auto` และโค้งมุม container 20px

- **Callout / Info box** (หมายเหตุ, คำเตือน)
  - พื้นสีอ่อนตามประเภท (info = ฟ้าอ่อนจาก Secondary, warning = ส้มอ่อน), **border-radius 16px**, ไอคอนซ้าย + ข้อความขวา, padding 16px

- **Navigation**
  - Top bar สูง 64px, พื้นขาว, Elevation Level 2 เมื่อ scroll, **border-radius 0 แต่ปุ่ม/ลิงก์ภายในโค้งมนหมด**
  - เมนู anchor ไปแต่ละ section: เกี่ยวกับ / เตรียมตัว / กำหนดการ / ประกาศ / ติดต่อ (ซ่อนหัวข้อที่ยังไม่มีข้อมูล เช่น เอกสารการอบรม, ข้อมูลผู้เข้าอบรม จนกว่าจะมีเนื้อหาจริง)
  - Mobile: hamburger เปิด sidebar แบบ overlay, มุมโค้ง 20px ด้านที่ชนขอบจอ

## Spacing
- หน่วยฐาน: 8px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Section spacing: 64px ระหว่าง section ใหญ่, 24px ระหว่าง card ในหมวดเดียวกัน
- Container max width: 960px (เนื้อหาอ่านง่าย ไม่กว้างเกินไปสำหรับข้อความยาว)
- Card grid gap: 20px

## Border Radius — เน้นความโค้งมน (เพิ่มจากต้นแบบทุกระดับ)
- **8px**: checklist box, badge เล็ก, input
- **16px**: callout box, หัวตาราง, chip เล็ก
- **24px**: การ์ดเนื้อหาหลัก (agenda card, announcement card), รูปภาพ/thumbnail ถ้ามี
- **32px**: การ์ดใหญ่พิเศษ (hero section, banner)
- **9999px**: ปุ่มทั้งหมด, chip, badge, avatar

## Do's and Don'ts
- Do ใช้ฟอนต์ Prompt ทุกที่ ทั้งหัวข้อ เนื้อหา ตาราง badge — ไม่ผสมฟอนต์อื่น
- Do เพิ่มความโค้งมนกว่าเว็บทั่วไป — ไม่มีมุมฉากในองค์ประกอบ interactive (ปุ่ม, การ์ด, badge)
- Don't ใช้สีแดง (Primary) เกินความจำเป็น — สงวนไว้สำหรับ badge ด่วน/deadline เท่านั้น
- Do ซ่อนหัวข้อ/เมนูของ section ที่ยังไม่มีข้อมูลจริง (เอกสารการอบรม, ข้อมูลผู้เข้าอบรม) จนกว่าจะเติมเนื้อหา — อย่าแสดง section ว่างเปล่าให้ผู้ใช้งานเห็น
- Don't ใส่เงาซ้อนกับเส้นขอบในองค์ประกอบเดียวกัน — เลือกใช้อย่างใดอย่างหนึ่ง
- Do ทำ metadata (วันที่/เวลา/สถานที่) ให้อ่านง่ายด้วยสี Text Secondary แยกจากหัวข้อหลักชัดเจน
