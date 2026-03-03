import { Router } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { RoleMiddleware } from '../middlewares/RoleMiddleware'; 
import { upload } from '../middlewares/UploadMiddleware'; 

const router = Router();

// --- [1. โซนสาธารณะ (Public Routes)] ---
router.get("/", PhotoController.getPhotos);

// --- [2. โซนสงวนสิทธิ์ (Protected Routes)] ---

// ✅ เปลี่ยนจาก "/" เป็น "/upload" ให้ตรงกับหน้าบ้าน
router.post(
  "/", 
  AuthMiddleware, 
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