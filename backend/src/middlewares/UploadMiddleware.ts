import multer from 'multer';

// --- [1. ตั้งค่าการจัดเก็บไฟล์ในหน่วยความจำ (Memory Storage)] ---
const storage = multer.memoryStorage();

// --- [2. ตัวกรองไฟล์ให้รับเฉพาะรูปภาพเท่านั้น] ---
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น!'), false);
  }
};

// --- [3. สร้างตัวแปร upload] ---
// ✅ fileSize ตั้งที่ 50MB (รองรับรูป DSLR ขนาดใหญ่ได้)
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});