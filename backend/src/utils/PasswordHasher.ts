//? Utility: Password Hasher
//@ คลาสสำหรับจัดการเข้ารหัส (Hash) และตรวจสอบรหัสผ่าน

import bcrypt from 'bcrypt';

//* context (กำหนดค่า Salt Rounds ยิ่งมากยิ่งปลอดภัย แต่ยิ่งช้า 10 คือมาตรฐานที่ดี)
const SALT_ROUNDS = 10;

export class PasswordHasher {
  // ฟังก์ชันสำหรับเข้ารหัสผ่านตอนสมัครสมาชิก
  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  // ฟังก์ชันสำหรับตรวจรหัสผ่านตอนล็อกอิน
  static async compare(password: string, hash: string): Promise<boolean> {
    //! สิ่งที่สำคัญมาก (ต้อง await เสมอ เพราะการ compare กินเวลา CPU)
    return await bcrypt.compare(password, hash);
  }
}