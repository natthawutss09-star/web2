# คลังหนังสือบาลี (HTML ล้วน)

## วิธีรันใน VS Code
1. เปิดโฟลเดอร์นี้ใน VS Code (File > Open Folder)
2. ติดตั้งส่วนขยาย **Live Server** (Ritwick Dey)
3. คลิกขวาที่ `index.html` > **Open with Live Server**

## โครงสร้าง
- หน้าบ้าน: index.html, books.html, about.html, contact.html
- หลังบ้าน: admin/login.html -> admin/dashboard.html
  - ผู้ใช้เริ่มต้น `admin` / รหัสผ่าน `123456789` (แก้ได้ใน admin/login.html)
- css/style.css, js/common.js (ข้อมูลเริ่มต้น + ฟังก์ชันร่วม)
- books/ : ใส่ไฟล์ PDF ตามชื่อใน dashboard

## ข้อควรรู้
- ข้อมูลที่แก้ในหลังบ้านเก็บใน localStorage ของเบราว์เซอร์นั้น ๆ เท่านั้น
  ผู้เข้าชมคนอื่นจะไม่เห็น ต้องใช้ "สำรองข้อมูล (JSON)" แล้วนำไปแก้ defaultBooks() ใน js/common.js
  หรือทำ backend จริง (Node.js/Firebase) เมื่อจะใช้งานจริง
- การล็อกอินเป็นฝั่งเบราว์เซอร์ ไม่ปลอดภัยจริง
