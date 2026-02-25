//? Utility: Token Generator
//@ ใช้สำหรับสร้าง JWT Token เมื่อ User ทำการ Login สำเร็จ

import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/JwtConfig';

//* context (Interface กำหนดรูปร่างของข้อมูลที่จะฝังลงไปใน Token)
export interface TokenPayload {
  userId: number;
  role: string;
}

export class TokenGenerator {
  // ฟังก์ชันสร้าง Token
  static generate(payload: TokenPayload): string {
    //! สิ่งที่สำคัญมาก (ไม่ควรเก็บข้อมูล Sensitive เช่น รหัสผ่าน ลงใน payload เด็ดขาด)
    return jwt.sign(payload, jwtConfig.secret as string, {
      expiresIn: jwtConfig.expiresIn as any,
    });
  }
}