import { Router } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { RoleMiddleware } from '../middlewares/RoleMiddleware';
import { upload } from '../middlewares/UploadMiddleware';

const router = Router();

// ✅ ต้องประกาศ specific routes ก่อน :id เสมอ
// ดึง Folders (Grouped by Event) — lazy load ด้วย ?page=N
router.get("/grouped", PhotoController.getGroupedByEvent);

// ดึงรูปใน Event เดียว — lazy load ด้วย ?page=N
router.get("/by-event/:eventName", PhotoController.getPhotosByEvent);

// ดึงรูปทั้งหมด (legacy)
router.get("/", PhotoController.getPhotos);

// อัปโหลดรูปใหม่
router.post("/",
  AuthMiddleware,
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  upload.single("image"),
  PhotoController.uploadPhoto
);

// แก้ไขรูป
router.put("/:id",
  AuthMiddleware,
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  upload.single("image"),
  PhotoController.updatePhoto
);

// ลบรูป
router.delete("/:id",
  AuthMiddleware,
  RoleMiddleware(["ADMIN", "CLUB_PRESIDENT"]),
  PhotoController.deletePhoto
);

export default router;