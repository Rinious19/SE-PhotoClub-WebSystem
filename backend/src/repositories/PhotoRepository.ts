// backend/src/repositories/PhotoRepository.ts

import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/Database";
import { Photo } from "../models/Photo";

interface PhotoRow extends RowDataPacket, Photo {}

export class PhotoRepository {
  // --- [1. สร้างรูปภาพใหม่] ---
  async create(data: Photo): Promise<any> {
    const query = `
      INSERT INTO photos (title, event_date, description, image_url, thumbnail_url, faculty, academic_year, file_hash, user_id, created_by)
      VALUES (?, STR_TO_DATE(?, '%Y-%m-%d'), ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result]: any = await pool.query(query, [
      data.title, data.event_date, data.description,
      data.image_url, data.thumbnail_url ?? null,
      data.faculty ?? null, data.academic_year ?? null,
      data.file_hash ?? null,
      data.user_id, data.created_by,
    ]);
    return { id: result.insertId, ...data };
  }

  // ✅ เช็ครูปซ้ำใน event เดียวกัน ด้วย MD5 hash
  async findDuplicateHash(eventTitle: string, hash: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM photos WHERE title = ? AND file_hash = ? AND deleted_at IS NULL LIMIT 1`,
      [eventTitle, hash]
    );
    return rows.length > 0;
  }

  // --- [2. อัปเดตข้อมูล] ---
  async update(id: number, data: Partial<Photo>): Promise<boolean> {
    let query = `UPDATE photos SET title = ?, event_date = STR_TO_DATE(?, '%Y-%m-%d'), description = ?, updated_by = ?`;
    let params: any[] = [data.title, data.event_date, data.description, data.updated_by];
    if (data.image_url)     { query += `, image_url = ?`;     params.push(data.image_url); }
    if (data.thumbnail_url) { query += `, thumbnail_url = ?`; params.push(data.thumbnail_url); }
    if (data.faculty !== undefined)       { query += `, faculty = ?`;        params.push(data.faculty ?? null); }
    if (data.academic_year !== undefined) { query += `, academic_year = ?`; params.push(data.academic_year ?? null); }
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
             description, image_url, thumbnail_url, faculty, academic_year, user_id, created_by, created_at
      FROM photos WHERE deleted_at IS NULL ORDER BY created_at DESC
    `);
    return rows as any[];
  }

  // --- [5. ดึงรูปตาม ID] ---
  async findById(id: number): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, title,
             DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
             description, image_url, thumbnail_url, faculty, academic_year, user_id, created_by, created_at
      FROM photos WHERE id = ? AND deleted_at IS NULL
    `, [id]);
    return rows[0] || null;
  }

  // ✅ --- [6. ดึงรูปแบบ Grouped by Event (สำหรับหน้า Folder)] ---
  async findGroupedByEvent(limit: number, offset: number): Promise<any[]> {
    // Step 1: ดึง event groups พร้อม faculty/academic_year ที่พบมากที่สุด
    const [groups] = await pool.query<RowDataPacket[]>(`
      SELECT
        title                                        AS event_name,
        DATE_FORMAT(MIN(event_date), '%Y-%m-%d')     AS event_date,
        COUNT(*)                                     AS photo_count,
        MIN(created_at)                              AS first_upload,
        (SELECT faculty FROM photos p2
         WHERE p2.title = photos.title AND p2.deleted_at IS NULL AND p2.faculty IS NOT NULL
         GROUP BY p2.faculty ORDER BY COUNT(*) DESC LIMIT 1)      AS faculty,
        (SELECT academic_year FROM photos p3
         WHERE p3.title = photos.title AND p3.deleted_at IS NULL AND p3.academic_year IS NOT NULL
         GROUP BY p3.academic_year ORDER BY COUNT(*) DESC LIMIT 1) AS academic_year
      FROM photos
      WHERE deleted_at IS NULL
      GROUP BY title
      ORDER BY first_upload DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    if (groups.length === 0) return [];

    // Step 2: ดึง 3 รูปแรกต่อ event
    const result = await Promise.all(
      groups.map(async (g: any) => {
        const [previews] = await pool.query<RowDataPacket[]>(`
          SELECT id, image_url, thumbnail_url
          FROM photos
          WHERE deleted_at IS NULL AND title = ?
          ORDER BY id ASC
          LIMIT 3
        `, [g.event_name]);

        return {
          event_name:    g.event_name,
          event_date:    g.event_date,
          photo_count:   g.photo_count,
          faculty:       g.faculty       || null,
          academic_year: g.academic_year || null,
          previews:      previews as any[],
        };
      })
    );

    return result;
  }

  // ✅ --- [7. นับจำนวน event groups ทั้งหมด (สำหรับ pagination)] ---
  async countGroups(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT title) AS total FROM photos WHERE deleted_at IS NULL
    `);
    return rows[0].total;
  }

  // ✅ --- [8. ดึงรูปใน event แบบ Pagination + filter category] ---
  async findByEventAndCategory(
    eventName: string,
    category: { faculty?: string; academic_year?: string } | null,
    limit: number,
    offset: number
  ): Promise<any[]> {
    let where = `deleted_at IS NULL AND title = ?`;
    const params: any[] = [eventName];
    if (category?.faculty)       { where += ` AND faculty = ?`;       params.push(category.faculty); }
    if (category?.academic_year) { where += ` AND academic_year = ?`; params.push(category.academic_year); }
    params.push(limit, offset);
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, title,
             DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
             description, image_url, thumbnail_url, faculty, academic_year, created_at
      FROM photos
      WHERE ${where}
      ORDER BY created_at ASC
      LIMIT ? OFFSET ?
    `, params);
    return rows as any[];
  }

  // ✅ --- [9. นับรูปใน event + filter category] ---
  async countByEventAndCategory(
    eventName: string,
    category: { faculty?: string; academic_year?: string } | null
  ): Promise<number> {
    let where = `deleted_at IS NULL AND title = ?`;
    const params: any[] = [eventName];
    if (category?.faculty)       { where += ` AND faculty = ?`;       params.push(category.faculty); }
    if (category?.academic_year) { where += ` AND academic_year = ?`; params.push(category.academic_year); }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM photos WHERE ${where}`, params
    );
    return rows[0].total;
  }

  // --- backward compat aliases ---
  async findByEventPaginated(eventName: string, limit: number, offset: number): Promise<any[]> {
    return this.findByEventAndCategory(eventName, null, limit, offset);
  }
  async countByEvent(eventName: string): Promise<number> {
    return this.countByEventAndCategory(eventName, null);
  }

  // --- [10. Audit Log] ---
  async logAction(photoId: number, action: string, userId: number, details: string): Promise<void> {
    await pool.query(
      `INSERT INTO photo_audit_logs (photo_id, action, user_id, details) VALUES (?, ?, ?, ?)`,
      [photoId, action, userId, details],
    );
  }

  // ✅ --- [11. ดึงรูปใน event กรองด้วย faculty/academic_year] ---
  async findByEventFiltered(
    eventName: string,
    faculty: string | null,
    academicYear: string | null,
    limit: number, offset: number
  ): Promise<any[]> {
    let sql = `
      SELECT id, title,
             DATE_FORMAT(event_date, '%Y-%m-%d') as event_date,
             description, image_url, thumbnail_url, faculty, academic_year, created_at
      FROM photos
      WHERE deleted_at IS NULL AND title = ?
    `;
    const params: any[] = [eventName];
    if (faculty)       { sql += ` AND faculty = ?`;       params.push(faculty); }
    if (academicYear)  { sql += ` AND academic_year = ?`; params.push(academicYear); }
    sql += ` ORDER BY created_at ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as any[];
  }

  // ✅ --- [12. นับรูปใน event กรองด้วย faculty/academic_year] ---
  async countByEventFiltered(
    eventName: string,
    faculty: string | null,
    academicYear: string | null
  ): Promise<number> {
    let sql = `SELECT COUNT(*) as total FROM photos WHERE deleted_at IS NULL AND title = ?`;
    const params: any[] = [eventName];
    if (faculty)       { sql += ` AND faculty = ?`;       params.push(faculty); }
    if (academicYear)  { sql += ` AND academic_year = ?`; params.push(academicYear); }
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows[0].total;
  }

  // ✅ --- [13. ดึง faculty และ academic_year ที่มีในระบบ (สำหรับ filter dropdown)] ---
  async getFacultiesByEvent(eventName: string): Promise<string[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT faculty FROM photos
      WHERE deleted_at IS NULL AND title = ? AND faculty IS NOT NULL AND faculty != ''
      ORDER BY faculty ASC
    `, [eventName]);
    return rows.map((r: any) => r.faculty);
  }

  async getAcademicYearsByEvent(eventName: string): Promise<string[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT academic_year FROM photos
      WHERE deleted_at IS NULL AND title = ? AND academic_year IS NOT NULL AND academic_year != ''
      ORDER BY academic_year DESC
    `, [eventName]);
    return rows.map((r: any) => r.academic_year);
  }
}