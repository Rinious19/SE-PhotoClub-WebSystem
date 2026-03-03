import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// ดึงรายการ Event (ใครๆ ก็ดูได้ หรือจะใส่ Auth ก็ได้)
router.get('/', EventController.getEvents);

// สร้าง Event ใหม่ (ต้อง Logged in)
router.post('/', AuthMiddleware, EventController.createEvent);

export default router;