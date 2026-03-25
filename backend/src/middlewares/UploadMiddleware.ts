//? Middleware: Upload + Thumbnail Generator
//@ diskStorage บันทึกรูปเต็มใน /uploads/photos/
//  sharp สร้าง thumbnail 400px ใน /uploads/thumbnails/ อัตโนมัติ

import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

// --- สร้าง folders ถ้ายังไม่มี ---
export const PHOTOS_DIR = path.join(__dirname, "../../uploads/photos");
export const THUMBNAILS_DIR = path.join(__dirname, "../../uploads/thumbnails");

[PHOTOS_DIR, THUMBNAILS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export const PHOTOS_URL_PREFIX = "/uploads/photos";
export const THUMBNAILS_URL_PREFIX = "/uploads/thumbnails";

//@ MIME types ที่อนุญาต — เฉพาะ jpg, png เท่านั้น
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_EXTS = new Set([".jpg", ".jpeg", ".png"]);

// ✅ Disk Storage — บันทึกไฟล์เต็มใน /uploads/photos/
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTOS_DIR),
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    //@ normalize: .jpg และ .jpeg → .jpg, อื่นๆ ใช้ตามจริง
    const ext =
      rawExt === ".jpeg" ? ".jpg" : ALLOWED_EXTS.has(rawExt) ? rawExt : ".jpg";
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

//@ fileFilter — อนุญาตเฉพาะ jpg/png/webp เช็คทั้ง MIME และ extension
const fileFilter = (_req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    ALLOWED_MIMES.has(file.mimetype) &&
    ALLOWED_EXTS.has(ext === ".jpeg" ? ".jpg" : ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error("กรุณาอัปโหลดเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ✅ สร้าง Thumbnail จากไฟล์ที่ multer บันทึกแล้ว
// คืนค่า thumbnail URL path
export const createThumbnail = async (
  originalFilename: string,
): Promise<string> => {
  const ext = path.extname(originalFilename).toLowerCase();
  const originalPath = path.join(PHOTOS_DIR, originalFilename);

  //@ กำหนด output format และ extension ให้ตรงกันเสมอ
  //  webp → webp, png → png, อื่นๆ (jpg) → jpeg
  let outputExt: string;
  let sharpFormat: keyof sharp.FormatEnum;
  if (ext === ".png") {
    outputExt = ".png";
    sharpFormat = "png";
  } else {
    outputExt = ".jpg";
    sharpFormat = "jpeg";
  }

  //@ thumbName ใช้ extension ที่ตรงกับ format จริง ไม่ใช่ extension ของต้นฉบับ
  const baseName = path.basename(originalFilename, ext);
  const thumbName = `thumb_${baseName}${outputExt}`;
  const thumbPath = path.join(THUMBNAILS_DIR, thumbName);

  await sharp(originalPath)
    .resize(400, 400, { fit: "cover", position: "centre" })
    .toFormat(sharpFormat, { quality: 80 })
    .toFile(thumbPath);

  return `${THUMBNAILS_URL_PREFIX}/${thumbName}`;
};

// ✅ ลบทั้งรูปเต็มและ thumbnail
export const deletePhotoFiles = (
  imageUrl?: string,
  thumbnailUrl?: string,
): void => {
  const tryDelete = (url?: string, baseDir?: string) => {
    if (!url) return;
    try {
      const filename = path.basename(url);
      const filepath = path.join(baseDir!, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    } catch {
      /* ignore */
    }
  };
  tryDelete(imageUrl, PHOTOS_DIR);
  tryDelete(thumbnailUrl, THUMBNAILS_DIR);
};
