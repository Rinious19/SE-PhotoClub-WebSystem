//? Routes: Auth
//@ กำหนด Endpoint (URL) สำหรับระบบ Authentication

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

//* context (ผูก URL เข้ากับฟังก์ชันใน Controller)
// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// export router ออกไปใช้งานใน server.ts
export default router;