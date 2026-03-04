import { Router } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { RoleMiddleware } from '../middlewares/RoleMiddleware'; 
import { upload } from '../middlewares/UploadMiddleware'; 

const router = Router();

// --- [1. โซนสาธารณะ (Public Routes)] ---
router.get("/", PhotoController.getPhotos);

// 🔒 แบบนี้ถูก: เฉพาะ Admin/President ที่ต้องมี Token ถึงจะอัปโหลดได้
router.post(
  "/", 
  AuthMiddleware, // 👮 ตัวตรวจ Token จะทำงานเฉพาะตอนที่มีการ POST เท่านั้น
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  upload.single("image"), 
  PhotoController.uploadPhoto
);

router.put(
  "/:id",
  AuthMiddleware,
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  upload.single("image"), 
  PhotoController.updatePhoto
);

router.delete(
  "/:id",
  AuthMiddleware,
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  PhotoController.deletePhoto
);

export default router;