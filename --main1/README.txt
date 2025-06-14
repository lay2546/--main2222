✅ วิธีใช้งาน:
1. ไปที่ https://console.cloud.google.com
2. สร้างโปรเจกต์ + เปิด Google Drive API
3. ดาวน์โหลด credentials.json → วางในโฟลเดอร์นี้
4. รัน 1 ครั้งเพื่อรับ token:
   node google-auth.js (ยังไม่รวมในไฟล์ตัวอย่าง)
5. ตั้งค่า YOUR_FOLDER_ID ให้เป็นโฟลเดอร์ Google Drive ที่คุณสร้าง
6. รัน: node server.js
7. POST ไปที่ /upload พร้อมแนบไฟล์ image

