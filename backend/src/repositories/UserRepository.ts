//? Repository: User Database
//@ จัดการการเข้าถึงข้อมูล User ใน MySQL Database

import { pool } from '../config/Database';
import type { User } from '../models/User';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

//* context (สร้าง Interface ขยายจาก RowDataPacket เพื่อให้ TypeScript รู้ว่า Query ออกมาจะได้ฟิลด์อะไรบ้าง ป้องกันบัค any)
interface UserRow extends RowDataPacket, User {}

export class UserRepository {
  // ฟังก์ชันค้นหา User จาก Username
  async findByUsername(username: string): Promise<User | undefined> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    // ถ้าเจอข้อมูล จะคืนค่าแถวแรก (Index 0) ถ้าไม่เจอจะกลายเป็น undefined
    return rows[0];
  }

  // ฟังก์ชันสร้าง User ใหม่ลงฐานข้อมูล
  async create(user: User): Promise<User> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (username, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [user.username, user.password_hash, user.role]
    );
    
    // คืนค่า User กลับไปพร้อมกับ ID ที่ Database สร้างให้ (Auto Increment)
    return { ...user, id: result.insertId };
  }
}