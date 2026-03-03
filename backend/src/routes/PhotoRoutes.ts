import { Router, RequestHandler } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
// ✅ [1] นำเข้า RoleMiddleware เพื่อใช้ตรวจสอบสิทธิ์ ADMIN
import { RoleMiddleware } from '../middlewares/RoleMiddleware'; 
import { upload } from '../middlewares/UploadMiddleware'; // นำเข้าระบบอัปโหลด

const router = Router();

// --- [1. โซนสาธารณะ (Public Routes)] ---
// ✅ ไม่ใส่ AuthMiddleware ทำให้ Guest (คนที่ไม่ได้ล็อกอิน) สามารถดึงข้อมูลไปดูได้
router.get("/", PhotoController.getPhotos);


// --- [2. โซนสงวนสิทธิ์ (Protected Routes)] ---
// ต้องผ่าน AuthMiddleware (ต้องล็อกอิน) และ RoleMiddleware (ต้องเป็น ADMIN หรือ PRESIDENT)
router.post(
  "/",
  AuthMiddleware,
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  upload.single("image"), // รับไฟล์รูป
  PhotoController.uploadPhoto
);

router.put(
  "/:id",
  AuthMiddleware,
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  upload.single("image"), // รับไฟล์รูปใหม่ (ถ้ามี)
  PhotoController.updatePhoto
);

router.delete(
  "/:id",
  AuthMiddleware,
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  PhotoController.deletePhoto
);

export default router;