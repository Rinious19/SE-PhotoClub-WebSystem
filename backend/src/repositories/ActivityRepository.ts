import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool }     from '../config/Database';

export class ActivityRepository {
  //@ ดึงกิจกรรมทั้งหมด
  async findAll(filters: any = {}): Promise<any[]> {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.keyword) {
      where += ' AND a.title LIKE ?';
      params.push(`%${filters.keyword}%`);
    }
    if (filters.status) {
      where += ' AND a.status = ?';
      params.push(filters.status);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, 
        COALESCE(a.category, (
          SELECT p.faculty 
          FROM activity_photos ap 
          JOIN photos p ON ap.photo_id = p.id 
          WHERE ap.activity_id = a.id AND p.faculty IS NOT NULL 
          LIMIT 1
        )) AS category, 
        u.username AS creator_name,
        (SELECT COUNT(*) FROM activity_photos WHERE activity_id = a.id) AS photo_count,
        (SELECT COUNT(*) FROM votes WHERE activity_id = a.id) AS total_votes
      FROM activities a
      LEFT JOIN users u ON u.id = a.created_by
      ${where}
      ORDER BY a.start_at DESC`,
      params
    );
    return rows;
  }


  //@ ดึงกิจกรรมตาม ID
  async findByIdWithPhotos(id: number): Promise<any | null> {
    const [actRows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, 
        COALESCE(a.category, (
          SELECT p.faculty 
          FROM activity_photos ap 
          JOIN photos p ON ap.photo_id = p.id 
          WHERE ap.activity_id = a.id AND p.faculty IS NOT NULL 
          LIMIT 1
        )) AS category, 
        u.username AS creator_name 
       FROM activities a 
       LEFT JOIN users u ON u.id = a.created_by 
       WHERE a.id = ?`,
      [id]
    );
    if (actRows.length === 0) return null;

    const [photoRows] = await pool.query<RowDataPacket[]>(
      `SELECT ap.id AS activity_photo_id, p.id AS photo_id, p.image_url, p.thumbnail_url, p.title AS photo_title,
        p.description AS photo_description, /* ✅ เพิ่มการดึง Description ตรงนี้ */
        p.faculty, p.academic_year,
        (SELECT COUNT(*) FROM votes v WHERE v.activity_id = ap.activity_id AND v.activity_photo_id = ap.id) AS vote_count,
        ap.sort_order
      FROM activity_photos ap
      JOIN photos p ON p.id = ap.photo_id
      WHERE ap.activity_id = ?
      ORDER BY ap.sort_order ASC`,
      [id]
    );

    return { ...actRows[0], photos: photoRows };
  }

  //@ สร้างกิจกรรมใหม่
  async create(data: any, photoIds: number[]): Promise<number> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const title = data.title || 'Untitled';
      const description = data.description || null;
      const start_at = data.start_at || null;
      const end_at = data.end_at || null;
      const status = data.status || 'ACTIVE';
      const created_by = data.created_by || null;
      
      const event_name = data.event_name || ''; 
      const category = data.category || data.faculty || null;

      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO activities (title, description, start_at, end_at, status, created_by, event_name, category) VALUES (?,?,?,?,?,?,?,?)`,
        [title, description, start_at, end_at, status, created_by, event_name, category]
      );

      const activityId = res.insertId;

      if (Array.isArray(photoIds) && photoIds.length > 0) {
        const placeholders = photoIds.map(() => '(?, ?, ?)').join(', ');
        const flatValues = photoIds.reduce((acc: any[], pid: number, idx: number) => {
          acc.push(activityId, pid, idx);
          return acc;
        }, []);

        await conn.query(
          `INSERT INTO activity_photos (activity_id, photo_id, sort_order) VALUES ${placeholders}`,
          flatValues
        );
      }

      await conn.commit();
      return activityId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  //@ อัปเดตกิจกรรม (✅ เพิ่มการอัปเดตตาราง activity_photos แบบ Transaction)
  async update(id: number, data: any, newPhotoIds?: number[]): Promise<boolean> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const title = data.title || 'Untitled';
      const description = data.description || null;
      const start_at = data.start_at || null;
      const end_at = data.end_at || null;
      const category = data.category || data.faculty || null;
      const status = data.status || null; // รับสถานะที่อาจคำนวณใหม่จาก Service มาด้วย

      // 1. อัปเดตข้อมูลกิจกรรมหลัก
      let updateSql = "UPDATE activities SET title=?, description=?, start_at=?, end_at=?, category=?";
      let updateParams: any[] = [title, description, start_at, end_at, category];
      
      if (status) {
        updateSql += ", status=?";
        updateParams.push(status);
      }
      
      updateSql += " WHERE id=?";
      updateParams.push(id);

      await conn.query(updateSql, updateParams);

      // 2. อัปเดตรูปภาพ ถ้ามีการเปลี่ยนแปลง (มี Array ส่งเข้ามา)
      if (newPhotoIds && Array.isArray(newPhotoIds)) {
        // ลบของเก่าทิ้งทั้งหมดก่อน
        await conn.query('DELETE FROM activity_photos WHERE activity_id = ?', [id]);
        
        // ถ้ายังมีรูปเหลืออยู่ ให้เพิ่มเข้าไปใหม่
        if (newPhotoIds.length > 0) {
          const placeholders = newPhotoIds.map(() => '(?, ?, ?)').join(', ');
          const flatValues = newPhotoIds.reduce((acc: any[], pid: number, idx: number) => {
            acc.push(id, pid, idx);
            return acc;
          }, []);

          await conn.query(
            `INSERT INTO activity_photos (activity_id, photo_id, sort_order) VALUES ${placeholders}`,
            flatValues
          );
        }
      }

      await conn.commit();
      return true;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  //@ ลบรูปออกจากกิจกรรม
  async removePhotoFromActivity(activityId: number, activityPhotoId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM activity_photos WHERE activity_id = ? AND id = ?`,
      [activityId, activityPhotoId]
    );
    return result.affectedRows > 0;
  }

  async syncStatuses(): Promise<void> {
    await pool.query(`
      UPDATE activities
      SET status = CASE
        WHEN NOW() < start_at THEN 'UPCOMING'
        WHEN NOW() > end_at THEN 'ENDED'
        ELSE 'ACTIVE'
      END
    `);
  }
}