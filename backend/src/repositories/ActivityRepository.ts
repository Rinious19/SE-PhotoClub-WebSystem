//? Repository: Activity
//@ SQL สำหรับตาราง activities + activity_photos
//  ใช้ column จริงหลัง ALTER TABLE: category, event_name, start_at, end_at
//  status: UPCOMING | ACTIVE | ENDED

import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool }     from '../config/Database';
import { Activity } from '../models/Activity';

export class ActivityRepository {

  //@ ดึงกิจกรรมทั้งหมด พร้อม filter และ sync status อัตโนมัติ
  async findAll(filters: {
    keyword?:  string;
    category?: string;
    status?:   string;
    dateFrom?: string;
    dateTo?:   string;
  } = {}): Promise<any[]> {

    let where  = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.keyword) {
      where += ' AND a.title LIKE ?';
      params.push(`%${filters.keyword}%`);
    }
    if (filters.category) {
      where += ' AND a.category = ?';
      params.push(filters.category);
    }
    if (filters.status) {
      where += ' AND a.status = ?';
      params.push(filters.status);
    }
    if (filters.dateFrom) {
      where += ' AND DATE(a.start_at) >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      where += ' AND DATE(a.start_at) <= ?';
      params.push(filters.dateTo);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         a.*,
         u.username              AS creator_name,
         COUNT(DISTINCT ap.id)  AS photo_count,
         COUNT(DISTINCT v.id)   AS vote_count
       FROM activities a
       LEFT JOIN users           u  ON u.id          = a.created_by
       LEFT JOIN activity_photos ap ON ap.activity_id = a.id
       LEFT JOIN votes           v  ON v.activity_id  = a.id
       ${where}
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      params
    );
    return rows as any[];
  }

  //@ ดึงกิจกรรมตาม id พร้อมรูปและจำนวนโหวตของแต่ละรูป
  async findByIdWithPhotos(id: number): Promise<any | null> {
    // ดึงข้อมูลหลักของกิจกรรม
    const [actRows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, u.username AS creator_name
       FROM activities a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.id = ?`,
      [id]
    );
    if (actRows.length === 0) return null;

    const activity = actRows[0];

    // ดึงรูปทั้งหมดในกิจกรรม พร้อมจำนวนโหวตของแต่ละรูป
    const [photoRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         ap.id             AS activity_photo_id,
         ap.photo_id,
         ap.sort_order,
         p.image_url,
         p.thumbnail_url,
         p.title           AS photo_title,
         p.faculty,
         p.academic_year,
         COUNT(v.id)       AS vote_count
       FROM activity_photos ap
       JOIN  photos p ON p.id  = ap.photo_id
       LEFT JOIN votes v
         ON  v.activity_id = ap.activity_id
         AND v.photo_id    = ap.id
       WHERE ap.activity_id = ?
       GROUP BY ap.id
       ORDER BY ap.sort_order ASC, ap.id ASC`,
      [id]
    );

    return { ...activity, photos: photoRows };
  }

  //@ สร้างกิจกรรม + เพิ่มรูปใน activity_photos (transaction)
  async create(
    data: Omit<Activity, 'id' | 'created_at' | 'updated_at'>,
    photoIds: number[]
  ): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // [1] insert ตัวกิจกรรม (ใช้ column จริงใน DB)
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO activities
           (title, description, category, event_name, start_at, end_at, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          data.description ?? null,
          data.category    ?? null,
          data.event_name,
          data.start_at,
          data.end_at,
          data.status,
          data.created_by,
        ]
      );
      const activityId = result.insertId;

      // [2] insert รูปทั้งหมดลงใน activity_photos
      if (photoIds.length > 0) {
        const photoValues = photoIds.map((pid, idx) => [activityId, pid, idx]);
        await connection.query(
          `INSERT INTO activity_photos (activity_id, photo_id, sort_order) VALUES ?`,
          [photoValues]
        );
      }

      await connection.commit();
      return activityId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  //@ อัปเดตกิจกรรม (ADMIN ปรับเวลา/ข้อมูล)
  async update(
    id: number,
    data: Partial<Pick<Activity, 'title' | 'description' | 'category' | 'start_at' | 'end_at' | 'status'>>
  ): Promise<boolean> {
    const fields: string[] = [];
    const params: any[]    = [];

    if (data.title       !== undefined) { fields.push('title = ?');       params.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.category    !== undefined) { fields.push('category = ?');    params.push(data.category); }
    if (data.start_at    !== undefined) { fields.push('start_at = ?');    params.push(data.start_at); }
    if (data.end_at      !== undefined) { fields.push('end_at = ?');      params.push(data.end_at); }
    if (data.status      !== undefined) { fields.push('status = ?');      params.push(data.status); }

    if (fields.length === 0) return false;
    params.push(id);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  //@ ลบรูปออกจากกิจกรรม (ไม่ลบรูปจริงใน photos)
  async removePhotoFromActivity(activityId: number, activityPhotoId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM activity_photos WHERE activity_id = ? AND id = ?`,
      [activityId, activityPhotoId]
    );
    return result.affectedRows > 0;
  }

  //@ sync status อัตโนมัติตามเวลาปัจจุบัน — เรียกก่อน query ทุกครั้ง
  async syncStatuses(): Promise<void> {
    const now = new Date();
    await pool.query(
      `UPDATE activities
       SET status = CASE
         WHEN start_at > ?  THEN 'UPCOMING'
         WHEN end_at   < ?  THEN 'ENDED'
         ELSE 'ACTIVE'
       END
       WHERE status != 'ENDED' OR end_at >= ?`,
      [now, now, now]
    );
  }
}