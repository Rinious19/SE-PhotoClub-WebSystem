//? Service: Auth
//@ จัดการ Business Logic สำหรับการ Login และ Register

import { UserRepository } from '../repositories/UserRepository';
import { CreateUserDTO } from '../dtos/CreateUserDTO';
import { User } from '../models/User';
import { UserRole } from '../enums/UserRole';
import { PasswordHasher } from '../utils/PasswordHasher';
import { TokenGenerator } from '../utils/TokenGenerator';

export class AuthService {
  private userRepository = new UserRepository();

  // Logic สำหรับสมัครสมาชิก
  async register(data: CreateUserDTO): Promise<User> {
    //* context (เช็คก่อนว่ามี username นี้ในระบบหรือยัง)
    const existingUser = await this.userRepository.findByUsername(data.username);
    if (existingUser) {
      //! สิ่งที่สำคัญมาก (ถ้ามีแล้วต้องโยน Error กลับไปให้ Controller จัดการ)
      throw new Error('Username นี้ถูกใช้งานแล้ว');
    }

    // เข้ารหัสผ่าน
    const hashedPassword = await PasswordHasher.hash(data.password);

    // สร้าง User ใหม่พร้อมกำหนด Role เริ่มต้นเป็น EXTERNAL_USER
    const newUser: User = {
      username: data.username,
      password_hash: hashedPassword,
      role: UserRole.EXTERNAL_USER,
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.userRepository.create(newUser);
  }

  // Logic สำหรับเข้าสู่ระบบ
  async login(username: string, password: string): Promise<string> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error('ไม่พบผู้ใช้งานในระบบ');
    }

    const isMatch = await PasswordHasher.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('รหัสผ่านไม่ถูกต้อง');
    }

    // สร้างและส่งคืน JWT Token
    return TokenGenerator.generate({
      userId: user.id!,
      role: user.role
    });
  }
}