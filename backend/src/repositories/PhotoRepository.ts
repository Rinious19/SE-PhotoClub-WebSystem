// backend/src/repositories/PhotoRepository.ts

import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/Database";
import { Photo } from "../models/Photo";

interface PhotoRow extends RowDataPacket, Photo {}

export class PhotoRepository {
  // --- [1. สร้างรูปภาพใหม่] ---
  async create(data: Photo): Promise<any> {
    const query = `
      INSERT INTO photos (title, event_date, description, image_url, user_id, created_by)
      VALUES (?, STR_TO_DATE(?, '%Y-%m-%d'), ?, ?, ?, ?)
    `;
    const [result]: any = await pool.query(query, [
      data.title, data.event_date, data.description,
      data.image_url, data.user_id, data.created_by,
    ]);
    return { id: result.insertId, ...data };
  }

  // --- [2. อัปเดตข้อมูล] ---
  async update(id: number, data: Partial<Photo>): Promise<boolean> {
    let query = `UPDATE photos SET title = ?, event_date = STR_TO_DATE(?, '%Y-%m-%d'), description = ?, updated_by = ?`;
    let params: any[] = [data.title, data.event_date, data.description, data.updated_by];
    if (data.image_url) { query += `, image_url = ?`; params.push(data.image_url); }
    query += ` WHERE id = ? AND deleted_at IS NULL`;
    params.push(id);
    const [result] = await pool.query<ResultSetHeader>(query, params);
    return result.affectedRows > 0;
  }

  // --- [3. Soft Delete] ---
  async softDelete(photoId: number, userId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE photos SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [userId, photoId],
    );
    return result.affectedRows > 0;
  }

  // --- [4. ดึงรูปทั้งหมด (ไม่ได้ใช้แล้ว แต่คงไว้เพื่อ backward compat)] ---
  async findAllActive(): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, title,
             DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
             description, image_url, user_id, created_by, created_at
      FROM photos WHERE deleted_at IS NULL ORDER BY created_at DESC
    `);
    return rows as any[];
  }

  // --- [5. ดึงรูปตาม ID] ---
  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, title,
             DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
             description, image_url, user_id, created_by, created_at
      FROM photos WHERE id = ? AND deleted_at IS NULL
    `, [id]);
    return rows[0] || null;
  }

  // ✅ --- [6. ดึงรูปแบบ Grouped by Event (สำหรับหน้า Folder)] ---
  // Compatible กับ MySQL 5.7+ (ไม่ใช้ ROW_NUMBER window function)
  async findGroupedByEvent(limit: number, offset: number): Promise<any[]> {
    // ดึง event groups พร้อม count และ date
    const [groups] = await pool.query<RowDataPacket[]>(`
      SELECT
        title                                          AS event_name,
        DATE_FORMAT(MIN(event_date), '%Y-%m-%d')       AS event_date,
        COUNT(*)                                       AS photo_count,
        MIN(created_at)                                AS first_upload
      FROM photos
      WHERE deleted_at IS NULL
      GROUP BY title
      ORDER BY first_upload DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    if (groups.length === 0) return [];

    const eventNames = groups.map((g: any) => g.event_name);

    // ดึง preview 3 รูปแรกของแต่ละ event
    // ใช้ self-join แทน ROW_NUMBER เพื่อ compat MySQL 5.7
    const placeholders = eventNames.map(() => '?').join(',');
    const [previews] = await pool.query<RowDataPacket[]>(`
      SELECT p.id, p.title AS event_name, p.image_url
      FROM photos p
      WHERE p.deleted_at IS NULL
        AND p.title IN (${placeholders})
        AND (
          SELECT COUNT(*) FROM photos p2
          WHERE p2.deleted_at IS NULL
            AND p2.title = p.title
            AND p2.id <= p.id
        ) <= 3
      ORDER BY p.title ASC, p.id ASC
    `, eventNames);

    // จับคู่ preview กับแต่ละ group
    const previewMap: Record<string, any[]> = {};
    for (const p of previews as any[]) {
      if (!previewMap[p.event_name]) previewMap[p.event_name] = [];
      if (previewMap[p.event_name].length < 3) previewMap[p.event_name].push(p);
    }

    return groups.map((g: any) => ({
      event_name: g.event_name,
      event_date: g.event_date,
      photo_count: g.photo_count,
      previews: previewMap[g.event_name] || [],
    }));
  }

  // ✅ --- [7. นับจำนวน event groups ทั้งหมด (สำหรับ pagination)] ---
  async countGroups(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT title) AS total FROM photos WHERE deleted_at IS NULL
    `);
    return rows[0].total;
  }

  // ✅ --- [8. ดึงรูปใน event แบบ Pagination (สำหรับหน้า Folder detail)] ---
  async findByEventPaginated(eventName: string, limit: number, offset: number): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, title,
             DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
             description, image_url, created_at
      FROM photos
      WHERE deleted_at IS NULL AND title = ?
      ORDER BY created_at ASC
      LIMIT ? OFFSET ?
    `, [eventName, limit, offset]);
    return rows as any[];
  }

  // ✅ --- [9. นับรูปใน event (สำหรับ pagination)] ---
  async countByEvent(eventName: string): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total FROM photos WHERE deleted_at IS NULL AND title = ?
    `, [eventName]);
    return rows[0].total;
  }

  // --- [10. Audit Log] ---
  async logAction(photoId: number, action: string, userId: number, details: string): Promise<void> {
    await pool.query(
      `INSERT INTO photo_audit_logs (photo_id, action, user_id, details) VALUES (?, ?, ?, ?)`,
      [photoId, action, userId, details],
    );
  }
}