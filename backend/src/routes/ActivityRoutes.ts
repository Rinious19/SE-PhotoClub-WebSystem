//? Routes: Activity
//@ กำหนด Endpoint สำหรับกิจกรรมโหวต
//  - GET  ทุกคนดูได้ (Guest / User / Admin / President)
//  - POST / PUT / DELETE ต้องมี Role ที่เหมาะสม

import { Router, RequestHandler } from 'express';
import { ActivityController }     from '../controllers/ActivityController';
import { AuthMiddleware }         from '../middlewares/AuthMiddleware';
import { RoleMiddleware }         from '../middlewares/RoleMiddleware';

const router = Router();

// ดึงกิจกรรมทั้งหมด (ทุกคน รวม Guest)
router.get('/', ActivityController.getAll as RequestHandler);

// ดึงกิจกรรมเดี่ยว (ทุกคน รวม Guest)
router.get('/:id', ActivityController.getById as RequestHandler);

// สร้างกิจกรรมใหม่ (CLUB_PRESIDENT เท่านั้น)
router.post(
  '/',
  AuthMiddleware as RequestHandler,
  RoleMiddleware(['CLUB_PRESIDENT']) as RequestHandler,
  ActivityController.create as RequestHandler
);

// อัปเดตกิจกรรม เช่น ปรับเวลา (ADMIN / CLUB_PRESIDENT)
router.put(
  '/:id',
  AuthMiddleware as RequestHandler,
  RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']) as RequestHandler,
  ActivityController.update as RequestHandler
);

// ลบรูปออกจากกิจกรรม (ADMIN / CLUB_PRESIDENT)
router.delete(
  '/:activityId/photos/:photoId',
  AuthMiddleware as RequestHandler,
  RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']) as RequestHandler,
  ActivityController.removePhoto as RequestHandler
);

export default router;