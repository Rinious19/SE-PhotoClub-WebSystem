//? Factory: UserFactory
//@ สร้าง User object ในรูปแบบต่างๆ (Factory Pattern)
//  ใช้เมื่อต้องการสร้าง User โดยไม่ต้องรู้รายละเอียด implementation

import { UserRole } from '../enums/UserRole';
import { PasswordHasher } from '../utils/PasswordHasher';
import type { User } from '../models/User';

export class UserFactory {

  //@ สร้าง Admin user — ใช้ตอน seed หรือ system setup
  static async createAdmin(username: string, password: string): Promise<User> {
    const hashedPassword = await PasswordHasher.hash(password);
    return {
      username,
      password_hash: hashedPassword,
      role:          UserRole.ADMIN,
      created_at:    new Date(),
      updated_at:    new Date(),
    };
  }

  //@ สร้าง Club President
  static async createPresident(username: string, password: string): Promise<User> {
    const hashedPassword = await PasswordHasher.hash(password);
    return {
      username,
      password_hash: hashedPassword,
      role:          UserRole.CLUB_PRESIDENT,
      created_at:    new Date(),
      updated_at:    new Date(),
    };
  }

  //@ สร้าง External User ทั่วไป (default role เหมือน AuthService.register)
  static async createExternalUser(username: string, password: string): Promise<User> {
    const hashedPassword = await PasswordHasher.hash(password);
    return {
      username,
      password_hash: hashedPassword,
      role:          UserRole.EXTERNAL_USER,
      created_at:    new Date(),
      updated_at:    new Date(),
    };
  }
}