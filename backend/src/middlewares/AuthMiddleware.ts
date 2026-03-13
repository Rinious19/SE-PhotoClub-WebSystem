//? Middleware: JWT Authentication
//@ ด่านตรวจคนเข้าเมือง: ตรวจสอบว่า Request ที่เข้ามามี JWT Token ที่ถูกต้องหรือไม่
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/JwtConfig';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const AuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // ... โค้ดด้านในของคุณเหมือนเดิมทั้งหมด ไม่ต้องแก้เลยครับ ...
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
    
    //* ฝังข้อมูลที่ถอดรหัสได้ (เปลี่ยนมาใช้ res.locals แทน req.user เพื่อแก้ปัญหา TypeScript อย่างเด็ดขาด)
    req.user = decoded;
    
    // ให้ผ่านไปทำงานที่ Controller หรือ Middleware ถัดไป
    next();
  } catch (error) {
    //! สิ่งที่สำคัญมาก (ถ้า Token หมดอายุ หรือถูกปลอมแปลง จะเข้าเงื่อนไขนี้)
     res.status(401).json({ 
      success: false, 
      message: 'Unauthorized:' 
    });
    return;
  }
};