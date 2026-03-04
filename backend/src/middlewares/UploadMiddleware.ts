import multer from 'multer';

// --- [1. ตั้งค่าการจัดเก็บไฟล์ในหน่วยความจำ (Memory Storage)] ---
// สำหรับ BLOB เราไม่ต้องสร้างโฟลเดอร์ uploads และไม่ต้องกำหนดชื่อไฟล์ครับ
const storage = multer.memoryStorage(); 

// --- [2. ตัวกรองไฟล์ (Filter) ให้รับเฉพาะรูปภาพเท่านั้น] ---
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น!'), false);
    }
}; 

// --- [3. สร้างตัวแปร upload เพื่อส่งออกไปให้ Route ใช้งาน] ---
export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 5MB
});