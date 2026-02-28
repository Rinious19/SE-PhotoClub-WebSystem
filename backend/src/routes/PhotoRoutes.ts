import { Router, RequestHandler } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

//@ ดึงรูปภาพทั้งหมด (Public)
router.get('/', PhotoController.getPhotos);
router.post('/upload', AuthMiddleware as RequestHandler, PhotoController.uploadPhoto as RequestHandler);

// ✅ เพิ่มเส้นทางสำหรับการลบรูปภาพ (ต้อง Login ก่อน)
router.delete('/delete/:id', AuthMiddleware as RequestHandler, PhotoController.deletePhoto as RequestHandler);

//@ อัปโหลดรูปภาพ (ต้อง Login)
router.post(
  '/upload', 
  AuthMiddleware as RequestHandler, 
  PhotoController.uploadPhoto as RequestHandler
);
export default router;