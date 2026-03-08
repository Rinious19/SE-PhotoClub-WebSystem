//? Middleware: Upload + Thumbnail Generator
//@ diskStorage บันทึกรูปเต็มใน /uploads/photos/
//  sharp สร้าง thumbnail 400px ใน /uploads/thumbnails/ อัตโนมัติ

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// --- สร้าง folders ถ้ายังไม่มี ---
export const PHOTOS_DIR     = path.join(__dirname, '../../uploads/photos');
export const THUMBNAILS_DIR = path.join(__dirname, '../../uploads/thumbnails');

[PHOTOS_DIR, THUMBNAILS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export const PHOTOS_URL_PREFIX     = '/uploads/photos';
export const THUMBNAILS_URL_PREFIX = '/uploads/thumbnails';

// ✅ Disk Storage — บันทึกไฟล์เต็มใน /uploads/photos/
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTOS_DIR),
  filename: (_req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น'), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ✅ สร้าง Thumbnail จากไฟล์ที่ multer บันทึกแล้ว
// คืนค่า thumbnail URL path
export const createThumbnail = async (
  originalFilename: string
): Promise<string> => {
  const ext          = path.extname(originalFilename).toLowerCase();
  const thumbName    = `thumb_${originalFilename}`;
  const thumbPath    = path.join(THUMBNAILS_DIR, thumbName);
  const originalPath = path.join(PHOTOS_DIR, originalFilename);

  await sharp(originalPath)
    .resize(400, 400, {
      fit: 'cover',        // crop ตรงกลาง เหมือน object-fit: cover
      position: 'centre',
    })
    .toFormat(ext === '.png' ? 'png' : 'jpeg', { quality: 80 })
    .toFile(thumbPath);

  return `${THUMBNAILS_URL_PREFIX}/${thumbName}`;
};

// ลบทั้งรูปเต็มและ thumbnail
export const deletePhotoFiles = (imageUrl?: string, thumbnailUrl?: string): void => {
  const tryDelete = (url?: string, baseDir?: string) => {
    if (!url) return;
    try {
      const filename = path.basename(url);
      const filepath = path.join(baseDir!, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    } catch { /* ignore */ }
  };
  tryDelete(imageUrl,     PHOTOS_DIR);
  tryDelete(thumbnailUrl, THUMBNAILS_DIR);
};