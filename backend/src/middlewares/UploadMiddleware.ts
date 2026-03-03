import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- [1. ตรวจสอบและสร้างโฟลเดอร์ uploads ถ้ายังไม่มี] ---
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- [2. ตั้งค่าการจัดเก็บไฟล์ (Storage)] ---
const storage = multer.diskStorage({
    // กำหนดโฟลเดอร์ปลายทางที่จะเซฟรูป
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    // กำหนดชื่อไฟล์ใหม่ เพื่อป้องกันชื่อซ้ำกัน (ใช้เวลาปัจจุบัน + เลขสุ่ม)
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname); // นามสกุลไฟล์ เช่น .jpg, .png
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});

// --- [3. ตัวกรองไฟล์ (Filter) ให้รับเฉพาะรูปภาพเท่านั้น] ---
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // ถ้ารหัสไฟล์ขึ้นต้นด้วย image/ ให้ผ่านได้
    } else {
        cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น!'), false); // ถ้าไม่ใช่ ปฏิเสธการรับไฟล์
    }
};

// --- [4. สร้างตัวแปร upload เพื่อส่งออกไปให้ Route ใช้งาน] ---
export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์สูงสุดที่ 5MB
});