//? Routes: Admin
//@ Endpoint สำหรับ Admin — ทุก route ต้องผ่าน Auth + Role check

import { Router }        from 'express';
import type { RequestHandler } from 'express';
import { AdminController }     from '../controllers/AdminController';
import { AuthMiddleware }      from '../middlewares/AuthMiddleware';
import { RoleMiddleware }      from '../middlewares/RoleMiddleware';

const router = Router();

//* context (Middleware ร่วมสำหรับทุก route ใน AdminRoutes)
const requireAuth  = AuthMiddleware      as RequestHandler;
const requireAdmin = RoleMiddleware(['ADMIN', 'CLUB_PRESIDENT']) as RequestHandler;

//@ User Management
router.get   ('/users',          requireAuth, requireAdmin, AdminController.getUsers    as RequestHandler);
router.patch ('/users/:id/role', requireAuth, requireAdmin, AdminController.changeRole  as RequestHandler);
router.delete('/users/:id',      requireAuth, requireAdmin, AdminController.deleteUser  as RequestHandler);

//@ History Log
router.get('/history', requireAuth, requireAdmin, AdminController.getHistory as RequestHandler);

export default router;