//? Controller: Auth
//@ รับ Request จาก Frontend ส่งให้ Service ทำงาน แล้วตอบ Response กลับ

import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

//* context (สร้าง instance ของ Service ไว้เรียกใช้งาน)
const authService = new AuthService();

export class AuthController {
  // รับ Request สมัครสมาชิก
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'สมัครสมาชิกสำเร็จ',
        data: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error: any) {
      //! สิ่งที่สำคัญมาก (ดักจับ Error จาก Service แล้วส่ง HTTP 400 Bad Request กลับไป)
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // รับ Request เข้าสู่ระบบ
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const token = await authService.login(username, password);
      
      res.status(200).json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        token: token
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }
}