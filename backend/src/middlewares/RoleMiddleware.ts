import { Request, Response, NextFunction } from 'express';

// แก้ปัญหา 'incorrectly extends' โดยใช้ Intersection Type แทน
export type AuthenticatedRequest = Request & {
  user?: {
    userId: number;
    role: string;
  };
};

export const RoleMiddleware = (allowedRoles: string[]) => {
  // ระบุ Type ให้ชัดเจน เพื่อให้ไฟล์ Route มองเห็นเป็น Middleware ที่ถูกต้อง
  return (req: any, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !user.role || !allowedRoles.includes(user.role)) {
       res.status(403).json({ 
        success: false, 
        message: 'Access Denied: คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' 
      });
      return;
    }
    next();
  };
};