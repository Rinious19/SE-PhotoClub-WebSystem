import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { RoleMiddleware } from '../middlewares/RoleMiddleware';

const router = Router();
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
);

export default router;