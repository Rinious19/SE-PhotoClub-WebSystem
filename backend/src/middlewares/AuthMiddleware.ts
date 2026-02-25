//? Middleware: JWT Authentication
//@ ด่านตรวจคนเข้าเมือง: ตรวจสอบว่า Request ที่เข้ามามี JWT Token ที่ถูกต้องหรือไม่

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/JwtConfig';

//* context (ขยาย Interface ของ Express Request ให้รู้จัก user)
interface AuthenticatedRequest extends Request {
  user?: any;
}

export const AuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // ดึง Token จาก Header ชื่อ 'Authorization'
  const authHeader = req.headers.authorization;

  // ถ้าไม่มี Header หรือไม่ได้นำหน้าด้วยคำว่า 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
     res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: ไม่พบ Token หรือรูปแบบ Token ไม่ถูกต้อง' 
    });
    return;
  }

  // ตัดคำว่า 'Bearer ' ออกเพื่อเอาแค่ตัว Token จริงๆ
  const token = authHeader.split(' ')[1];

  try {
    // ถอดรหัส Token ด้วย Secret Key ของเรา
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // ฝังข้อมูลที่ถอดรหัสได้ (เช่น userId, role) ลงไปใน Request
    req.user = decoded;
    
    // ให้ผ่านไปทำงานที่ Controller หรือ Middleware ถัดไป
    next();
  } catch (error) {
    //! สิ่งที่สำคัญมาก (ถ้า Token หมดอายุ หรือถูกปลอมแปลง จะเข้าเงื่อนไขนี้)
     res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Token หมดอายุหรือไม่ถูกต้อง' 
    });
    return;
  }
};