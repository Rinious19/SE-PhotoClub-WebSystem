import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { RoleMiddleware } from '../middlewares/RoleMiddleware';

const router = Router();

// ดึงรายการ Event (ทุกคนดูได้)
router.get('/', EventController.getEvents);

// ✅ นับรูปภาพที่ผูกกับ event (ใช้ใน confirm modal ก่อนลบ)
router.get('/photo-count', EventController.getPhotoCount);

// สร้าง Event ใหม่
router.post('/', AuthMiddleware, RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']), EventController.createEvent);

// แก้ไข Event (cascade update photos)
router.put('/:id', AuthMiddleware, RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']), EventController.updateEvent);

// ลบ Event (cascade delete photos)
router.delete('/:id', AuthMiddleware, RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']), EventController.deleteEvent);

export default router;