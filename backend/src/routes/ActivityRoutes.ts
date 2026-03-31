//@ ไฟล์: backend/src/routes/ActivityRoutes.ts

import { Router, RequestHandler } from 'express';
import { ActivityController }     from '../controllers/ActivityController';
import { AuthMiddleware }         from '../middlewares/AuthMiddleware';
import { RoleMiddleware }         from '../middlewares/RoleMiddleware';

const router = Router();

// [1] ดึงกิจกรรมทั้งหมด (Guest ดูได้)
// แก้ปัญหา 404 หน้าแรก
router.get('/', ActivityController.getAll as RequestHandler);

// ทดสอบแบบง่ายที่สุด (ถ้าเรียกอันนี้ผ่าน แสดงว่า Path ใน app.ts ถูกต้อง)
router.get('/debug', (req, res) => {
  res.json({ message: "Activity Route is connected!" });
});

// [2] ดึงกิจกรรมเดี่ยว (Guest ดูได้)
router.get('/:id', ActivityController.getById as RequestHandler);

// [3] สร้างกิจกรรมใหม่ (CLUB_PRESIDENT เท่านั้น)
// แก้ปัญหา 404 ตอนกดสร้างกิจกรรม
router.post(
  '/',
  AuthMiddleware as RequestHandler,
  RoleMiddleware(['CLUB_PRESIDENT']) as RequestHandler,
  ActivityController.create as RequestHandler
);

// [4] อัปเดตกิจกรรม (ADMIN / CLUB_PRESIDENT)
router.put(
  '/:id',
  AuthMiddleware as RequestHandler,
  RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']) as RequestHandler,
  ActivityController.update as RequestHandler
);

// [5] ลบรูปออกจากกิจกรรม
router.delete(
  '/:activityId/photos/:photoId',
  AuthMiddleware as RequestHandler,
  RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']) as RequestHandler,
  ActivityController.removePhoto as RequestHandler
);

export default router;