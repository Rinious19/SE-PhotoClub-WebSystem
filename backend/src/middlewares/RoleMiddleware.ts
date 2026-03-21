//? Middleware: Role Checking
//@ ตรวจสอบสิทธิ์การเข้าถึง Route ต่างๆ ว่า User มี Role ตรงตามที่กำหนดหรือไม่

import { Request, Response, NextFunction } from 'express';

//* context (ขยาย Interface ของ Request เพื่อให้รองรับ user ที่แนบมาจาก AuthMiddleware)
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const RoleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // ดึงข้อมูล user จาก request (ซึ่งควรถูกเซ็ตไว้ก่อนหน้าโดย AuthMiddleware)
    const user = req.user;

    //! สิ่งที่สำคัญมาก (ถ้าไม่มี user หรือ role ไม่ตรง ให้เตะออกทันที HTTP 403 Forbidden)
    if (!user || !allowedRoles.includes(user.role)) {
       res.status(403).json({ 
        success: false, 
        message: 'Access Denied: คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' 
      });
      return;
    }

    // ถ้า Role ถูกต้อง ให้ไปทำงานฟังก์ชันถัดไป (Controller)
    next();
  };
};