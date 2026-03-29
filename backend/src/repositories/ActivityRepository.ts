import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool }     from '../config/Database';
import { Activity } from '../models/Activity';

export class ActivityRepository {
  //@ ดึงกิจกรรมทั้งหมด พร้อมข้อมูลคนสร้างและจำนวนโหวตรวม
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
      `SELECT a.*, u.username AS creator_name,
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

  //@ ดึงกิจกรรมตาม ID พร้อมรูปภาพและคะแนนโหวตแยกตามรูป
  //! แก้ไข: ใช้ v.activity_photo_id แทน v.photo_id เพื่อให้ตรงกับ schema จริง
  async findByIdWithPhotos(id: number): Promise<any | null> {
    const [actRows] = await pool.query<RowDataPacket[]>(
      "SELECT a.*, u.username AS creator_name FROM activities a LEFT JOIN users u ON u.id = a.created_by WHERE a.id = ?",
      [id]
    );
    if (actRows.length === 0) return null;

    const [photoRows] = await pool.query<RowDataPacket[]>(
      `SELECT ap.id AS activity_photo_id, p.id AS photo_id, p.image_url, p.thumbnail_url, p.title AS photo_title,
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

  //@ สร้างกิจกรรมใหม่ (Transaction)
  async create(data: any, photoIds: number[]): Promise<number> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // ✅ 1. ดักจับค่า undefined ทุกตัว (ถ้าไม่ได้ส่งมาให้เป็น null แทน เพื่อให้ SQL ไม่พัง)
      const title = data.title || 'Untitled';
      const description = data.description || null;
      const start_at = data.start_at || null;
      const end_at = data.end_at || null;
      const status = data.status || 'ACTIVE'; // ถ้าไม่ส่งสถานะมา ให้บังคับเป็น ACTIVE
      const created_by = data.created_by || null;

      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO activities (title, description, start_at, end_at, status, created_by) VALUES (?,?,?,?,?,?)`,
        [title, description, start_at, end_at, status, created_by]
      );

      const activityId = res.insertId;

      // ✅ 2. เปลี่ยนวิธี Bulk Insert เพื่อหลีกเลี่ยง Syntax Error "near NULL" ของ mysql2
      if (Array.isArray(photoIds) && photoIds.length > 0) {
        // สร้าง (?, ?, ?) ตามจำนวนรูปภาพ
        const placeholders = photoIds.map(() => '(?, ?, ?)').join(', ');
        
        // ยุบรวมข้อมูลเป็น Array 1 มิติ (Flat Array)
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
      console.error("Create Activity Error:", e);
      throw e;
    } finally {
      conn.release();
    }
  }

  //@ อัปเดตกิจกรรม
  async update(id: number, data: any): Promise<boolean> {
    // ✅ ดักจับค่าว่างตอน Update ด้วยเช่นกัน
    const title = data.title || 'Untitled';
    const description = data.description || null;
    const start_at = data.start_at || null;
    const end_at = data.end_at || null;

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE activities SET title=?, description=?, start_at=?, end_at=? WHERE id=?",
      [title, description, start_at, end_at, id]
    );
    return result.affectedRows > 0;
  }

  //@ ลบรูปออกจากกิจกรรม
  async removePhotoFromActivity(activityId: number, activityPhotoId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM activity_photos WHERE activity_id = ? AND id = ?`,
      [activityId, activityPhotoId]
    );
    return result.affectedRows > 0;
  }

  //@ อัปเดตสถานะอัตโนมัติ (UPCOMING, ACTIVE, ENDED)
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