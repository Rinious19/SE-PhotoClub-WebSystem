//? Repository: User
//@ จัดการการเข้าถึงข้อมูล User ในฐานข้อมูล

import { User } from '../models/User';
import { UserRole } from '../enums/UserRole';

//* context (คืนนี้ใช้ Mock Data จำลอง Database ไปก่อน เพื่อป้องกัน Error จากการเชื่อมต่อ Database)
const mockUsers: User[] = [];

export class UserRepository {
  // ฟังก์ชันค้นหา User จาก Username
  async findByUsername(username: string): Promise<User | undefined> {
    return mockUsers.find(user => user.username === username);
  }

  // ฟังก์ชันสร้าง User ใหม่
  async create(user: User): Promise<User> {
    const newUser = { ...user, id: mockUsers.length + 1 };
    mockUsers.push(newUser);
    return newUser;
  }
}