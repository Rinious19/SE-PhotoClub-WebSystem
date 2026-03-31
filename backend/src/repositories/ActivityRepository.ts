import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/Database";

export class ActivityRepository {
  // Get all activities with optional filters
  async findAll(filters: any = {}): Promise<any[]> {
    let where = "WHERE 1=1";
    const params: any[] = [];

    if (filters.keyword) {
      where += " AND a.title LIKE ?";
      params.push(`%${filters.keyword}%`);
    }
    if (filters.status) {
      where += " AND a.status = ?";
      params.push(filters.status);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*,
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

  // Get single activity with its photos and vote counts
  async findByIdWithPhotos(id: number): Promise<any | null> {
    const [actRows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, u.username AS creator_name
       FROM activities a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.id = ?`,
      [id]
    );
    if (actRows.length === 0) return null;

    const [photoRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        ap.id AS activity_photo_id,
        p.id AS photo_id,
        p.image_url,
        p.thumbnail_url,
        p.title AS photo_title,
        p.event_name,
        p.faculty,
        p.academic_year,
        (SELECT COUNT(*) FROM votes v
          WHERE v.activity_id = ap.activity_id
          AND v.activity_photo_id = ap.id) AS vote_count,
        ap.sort_order
      FROM activity_photos ap
      JOIN photos p ON p.id = ap.photo_id
      WHERE ap.activity_id = ?
      ORDER BY ap.sort_order ASC`,
      [id]
    );

    return { ...actRows[0], photos: photoRows };
  }

  // Create activity and link photos
  async create(data: any, photoIds: number[]): Promise<number> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO activities
          (title, description, start_at, end_at, status, created_by, event_name, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title || "Untitled",
          data.description || null,
          data.start_at || null,
          data.end_at || null,
          data.status || "UPCOMING",
          data.created_by || null,
          data.event_name || "",
          data.category || data.faculty || null,
        ]
      );

      const activityId = res.insertId;

      if (Array.isArray(photoIds) && photoIds.length > 0) {
        const placeholders = photoIds.map(() => "(?, ?, ?)").join(", ");
        const flatValues = photoIds.reduce(
          (acc: any[], pid: number, idx: number) => {
            acc.push(activityId, pid, idx);
            return acc;
          },
          []
        );
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

  // Update activity metadata
  async update(id: number, data: any): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE activities SET title=?, description=?, start_at=?, end_at=?, category=? WHERE id=?",
      [
        data.title || "Untitled",
        data.description || null,
        data.start_at || null,
        data.end_at || null,
        data.category || data.faculty || null,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  // Remove a single photo from an activity
  async removePhotoFromActivity(
    activityId: number,
    activityPhotoId: number
  ): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM activity_photos WHERE activity_id = ? AND id = ?`,
      [activityId, activityPhotoId]
    );
    return result.affectedRows > 0;
  }

  // Sync statuses based on current time
  async syncStatuses(): Promise<void> {
    await pool.query(`
      UPDATE activities
      SET status = CASE
        WHEN NOW() < start_at THEN 'UPCOMING'
        WHEN NOW() > end_at   THEN 'ENDED'
        ELSE 'ACTIVE'
      END
      WHERE start_at IS NOT NULL AND end_at IS NOT NULL
    `);
  }
}