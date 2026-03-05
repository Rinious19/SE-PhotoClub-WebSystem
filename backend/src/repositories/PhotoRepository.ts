// backend/src/repositories/PhotoRepository.ts

import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/Database";
import { Photo } from "../models/Photo";

interface PhotoRow extends RowDataPacket, Photo {}

export class PhotoRepository {
  // --- [1. สร้างรูปภาพใหม่] ---
  async create(data: Photo): Promise<any> {
    // ✅ ใช้ STR_TO_DATE บังคับให้ MySQL อ่าน string "YYYY-MM-DD" เป็น DATE โดยตรง
    const query = `
      INSERT INTO photos (title, event_date, description, image_url, user_id, created_by)
      VALUES (?, STR_TO_DATE(?, '%Y-%m-%d'), ?, ?, ?, ?)
    `;
    const [result]: any = await pool.query(query, [
      data.title,
      data.event_date,
      data.description,
      data.image_url,
      data.user_id,
      data.created_by,
    ]);
    return { id: result.insertId, ...data };
  }

  // --- [2. อัปเดตข้อมูล] ---
  async update(id: number, data: Partial<Photo>): Promise<boolean> {
    // ✅ ใช้ STR_TO_DATE สำหรับ event_date
    let query = `UPDATE photos SET title = ?, event_date = STR_TO_DATE(?, '%Y-%m-%d'), description = ?, updated_by = ?`;
    let params: any[] = [data.title, data.event_date, data.description, data.updated_by];

    if (data.image_url) {
      query += `, image_url = ?`;
      params.push(data.image_url);
    }
    query += ` WHERE id = ? AND deleted_at IS NULL`;
    params.push(id);

    const [result] = await pool.query<ResultSetHeader>(query, params);
    return result.affectedRows > 0;
  }

  // --- [3. ดึงรูปภาพทั้งหมด (Active)] ---
  async findAllActive(): Promise<any[]> {
    // ✅ ใช้ DATE_FORMAT ให้ได้ string "YYYY-MM-DD" กลับมาตรงๆ
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, title,
             DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
             description, image_url, user_id, created_by, created_at
      FROM photos
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    return rows as any[];
  }

  // --- [4. ระบบ Soft Delete] ---
  async softDelete(photoId: number, userId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE photos SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [userId, photoId],
    );
    return result.affectedRows > 0;
  }

  // --- [5. ดึงรูปภาพตาม ID] ---
  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, title,
             DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
             description, image_url, user_id, created_by, created_at
      FROM photos
      WHERE id = ? AND deleted_at IS NULL
    `, [id]);
    return rows[0] || null;
  }

  // --- [6. ระบบบันทึกประวัติ (Audit Log)] ---
  async logAction(photoId: number, action: string, userId: number, details: string): Promise<void> {
    await pool.query(
      `INSERT INTO photo_audit_logs (photo_id, action, user_id, details) VALUES (?, ?, ?, ?)`,
      [photoId, action, userId, details],
    );
  }
}