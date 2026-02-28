//? Middleware: Role Checking
//@ ตรวจสอบสิทธิ์การเข้าถึง Route ต่างๆ ว่า User มี Role ตรงตามที่กำหนดหรือไม่

import { Response, NextFunction } from 'express';
// ✅ Import Interface ตัวกลางที่เราสร้างไว้ใน AuthMiddleware มาใช้งานร่วมกัน
import { AuthenticatedRequest } from './AuthMiddleware';

export const RoleMiddleware = (allowedRoles: string[]) => {
  // ✅ ใช้ AuthenticatedRequest ที่ Import มา เพื่อให้ Type ตรงกันทั้งโปรเจค
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