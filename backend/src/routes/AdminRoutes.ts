import { Router, RequestHandler } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { RoleMiddleware } from '../middlewares/RoleMiddleware';

const router = Router();

// ✅ ใช้ "as RequestHandler" กำกับทุกตัวที่เป็น Middleware/Controller ของเรา
router.delete(
  '/delete/:id', 
  AuthMiddleware as RequestHandler, 
  RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']) as RequestHandler,//roll ที่มีสิทธิ์ลบรูป 'ADMIN', 'CLUB_PRESIDENT'
  PhotoController.deletePhoto as RequestHandler
);

router.put(
  '/update/:id', 
  AuthMiddleware as RequestHandler, 
  RoleMiddleware(['Admin', 'President']) as RequestHandler, 
  PhotoController.updatePhoto as RequestHandler
);

export default router;