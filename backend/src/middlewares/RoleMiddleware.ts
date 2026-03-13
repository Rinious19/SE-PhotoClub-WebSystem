//? Middleware: Role Checking
//@ ตรวจสอบสิทธิ์การเข้าถึง Route ต่างๆ ว่า User มี Role ตรงตามที่กำหนดหรือไม่

import { Response, NextFunction } from 'express';
// ✅ Import Interface ตัวกลางที่เราสร้างไว้ใน AuthMiddleware มาใช้งานร่วมกัน
import { AuthenticatedRequest } from './AuthMiddleware';

export const RoleMiddleware = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    // 🔍 เพิ่มบรรทัดนี้เพื่อดูว่า Backend เห็นเราเป็นใคร
    console.log("Debug RoleMiddleware - User from Token:", req.user);
    console.log("Debug RoleMiddleware - Allowed Roles:", allowedRoles);

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access Denied: คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' 
      });
    }
    next();
  };
};