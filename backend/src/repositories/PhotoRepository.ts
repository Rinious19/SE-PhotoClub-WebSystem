// backend/src/repositories/PhotoRepository.ts

import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/Database"; // ✅ นำเข้า pool ถูกต้องแล้ว
import { Photo } from "../models/Photo";

interface PhotoRow extends RowDataPacket, Photo {}

export class PhotoRepository {
  // --- [1. สร้างรูปภาพใหม่] ---
  async create(data: Photo): Promise<any> {
    const query = `
    INSERT INTO photos (title, event_date, description, image_url, user_id, created_by) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

    // 🌟 ต้องมี [result] เพื่อรับค่าที่ส่งกลับมาจาก Database (เช่น ID ที่เพิ่มเข้าไปใหม่)
    const [result]: any = await pool.query(query, [
      data.title,
      data.event_date,
      data.description,
      data.image_url,
      data.user_id,
      data.created_by,
    ]);

    // คืนค่า ID ที่ได้จาก Auto Increment กลับไปให้ Controller
    return { id: result.insertId, ...data };
  }

  // --- [2. อัปเดตข้อมูล] ---
  async update(id: number, data: Partial<Photo>): Promise<boolean> {
    // ✅ เพิ่ม event_date เข้าไปในคำสั่ง UPDATE
    let query = `UPDATE photos SET title = ?, event_date = ?, description = ?, updated_by = ?`;
    let params: any[] = [
      data.title,
      data.event_date,
      data.description,
      data.updated_by,
    ];

    // ถ้ามีการส่งไฟล์รูปใหม่มาด้วย ให้เพิ่มคำสั่งอัปเดต image_url
    if (data.image_url) {
      query += `, image_url = ?`;
      params.push(data.image_url);
    }

    query += ` WHERE id = ? AND deleted_at IS NULL`;
    params.push(id);

    const [result] = await pool.query<ResultSetHeader>(query, params);
    return result.affectedRows > 0;
  }

  // --- [3. ระบบ Soft Delete (ลบลงถังขยะ)] ---
  async softDelete(photoId: number, userId: number): Promise<boolean> {
    // ✅ เปลี่ยนเป็น pool.query
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE photos 
       SET deleted_at = NOW(), deleted_by = ? 
       WHERE id = ? AND deleted_at IS NULL`,
      [userId, photoId],
    );
    return result.affectedRows > 0;
  }

  // --- [4. ระบบบันทึกประวัติ (Audit Log)] ---
  async logAction(
    photoId: number,
    action: string,
    userId: number,
    details: string,
  ): Promise<void> {
    // ✅ เปลี่ยนเป็น pool.query
    await pool.query(
      `INSERT INTO photo_audit_logs (photo_id, action, user_id, details) 
       VALUES (?, ?, ?, ?)`,
      [photoId, action, userId, details],
    );
  }

  // --- [5. ดึงเฉพาะรูปภาพที่ยังไม่ถูกลบ] ---
  async findAllActive(): Promise<Photo[]> {
    // ✅ เปลี่ยนเป็น pool.query และระบุชนิดเป็น <PhotoRow[]>
    const [rows] = await pool.query<PhotoRow[]>(
      `SELECT * FROM photos WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    );
    return rows; // ❌ ไม่ต้องใช้ (rows as Photo[]) แล้ว
  }

  // ฟังก์ชัน findAll เดิม (สำหรับ Admin ดูรูปทั้งหมดรวมถึงที่ลบไปแล้ว)
  async findAll(): Promise<Photo[]> {
    // ✅ เปลี่ยนเป็น pool.query
    const [rows] = await pool.query<PhotoRow[]>(
      `SELECT * FROM photos ORDER BY created_at DESC`,
    );
    return rows;
  }
}
