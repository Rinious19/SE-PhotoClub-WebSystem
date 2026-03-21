<<<<<<< HEAD
import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
=======
import { Router, RequestHandler } from 'express';
import { PhotoController } from '../controllers/PhotoController';
>>>>>>> fe687ab4973be30cfd7184d885fc117760ffb180
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { RoleMiddleware } from '../middlewares/RoleMiddleware';

const router = Router();
<<<<<<< HEAD
const controller = new AdminController();

router.get(
  '/users',
  AuthMiddleware,
  RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']),
  controller.getUsers
);

router.post(
  '/change-role',
  AuthMiddleware,
  RoleMiddleware(['ADMIN']),
  controller.changeRole
=======

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
  RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']) as RequestHandler, 
  PhotoController.updatePhoto as RequestHandler
>>>>>>> fe687ab4973be30cfd7184d885fc117760ffb180
);

export default router;