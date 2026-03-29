//? Service: Admin Service
//@ Business Logic สำหรับการจัดการผู้ใช้งาน (เปลี่ยน Role, ดู User ทั้งหมด)

import { pool } from '../config/Database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { UserRole } from '../enums/UserRole';
import { HistoryService } from './HistoryService';

const historyService = new HistoryService();

export class AdminService {

  //@ ดึง User ทั้งหมด (ไม่รวม password_hash เพื่อความปลอดภัย)
  async getAllUsers(): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    return rows;
  } 

  //@ เปลี่ยน Role ของ User — บันทึก history log ด้วย
  async changeUserRole(params: {
    targetUserId: number;
    newRole:      UserRole;
    actorId:      number;
  }): Promise<void> {
    const { targetUserId, newRole, actorId } = params;

    //* context (ดึง role เก่าก่อน เพื่อบันทึกใน history)
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT username, role FROM users WHERE id = ?',
      [targetUserId]
    );

    if (rows.length === 0) {
      throw new Error(`ไม่พบผู้ใช้งาน ID ${targetUserId}`);
    }

    const oldRole    = rows[0].role as string;
    const targetName = rows[0].username as string;

    //! สิ่งที่สำคัญมาก (ป้องกันการ downgrade Admin ตัวเอง)
    if (actorId === targetUserId) {
      throw new Error('ไม่สามารถเปลี่ยน Role ของตัวเองได้');
    }

    await pool.execute<ResultSetHeader>(
      'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
      [newRole, targetUserId]
    );

    await historyService.log({
      actorId,
      action:     'CHANGE_ROLE',
      targetType: 'USER',
      targetId:   targetUserId,
      detail:     { username: targetName, from: oldRole, to: newRole },
    });
  }

  //@ ลบ User (Soft delete — เปลี่ยน role เป็น GUEST แทนการลบจริง)
  //  เพื่อรักษา Foreign Key ที่ photos และ logs อ้างอิงอยู่
  async deleteUser(params: {
    targetUserId: number;
    actorId:      number;
  }): Promise<void> {
    const { targetUserId, actorId } = params;

    if (actorId === targetUserId) {
      throw new Error('ไม่สามารถลบบัญชีของตัวเองได้');
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT username FROM users WHERE id = ?',
      [targetUserId]
    );

    if (rows.length === 0) throw new Error('ไม่พบผู้ใช้งาน');
    const targetName = rows[0].username as string;

    //@ Soft delete: เปลี่ยน role → GUEST แทนการลบ
    await pool.execute<ResultSetHeader>(
      `UPDATE users SET role = 'GUEST', updated_at = NOW() WHERE id = ?`,
      [targetUserId]
    );

    await historyService.log({
      actorId,
      action:     'DELETE_USER',
      targetType: 'USER',
      targetId:   targetUserId,
      detail: `ระงับบัญชี username: ${targetName}`,
    });
  }
}