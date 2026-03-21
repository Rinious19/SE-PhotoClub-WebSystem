//? Model: User
//@ โครงสร้างข้อมูลของ User ที่สอดคล้องกับ Database

import { UserRole } from '../enums/UserRole';

//* context (กำหนด Interface ของ User เพื่อใช้ในการอ้างอิง Type ทั่วทั้งโปรเจค)
export interface User {
  id?: number;              // สร้างโดย Database (Auto Increment) เลยให้เป็น Optional (?) ไว้ก่อน
  username: string;         // ชื่อผู้ใช้งาน
  password_hash: string;    // รหัสผ่านที่เข้ารหัสแล้ว
  role: UserRole;           // สิทธิ์การใช้งาน
  created_at?: Date;        // วันที่สร้างบัญชี
  updated_at?: Date;        // วันที่แก้ไขบัญชีล่าสุด
}