import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/Database";

export class PhotoRepository {
  // Check for duplicate photo hash within same event
  async findDuplicateHash(
    eventName: string,
    fileHash: string
  ): Promise<any | null> {
    const [rows]: any = await pool.query(
      "SELECT * FROM photos WHERE event_name = ? AND file_hash = ? AND deleted_at IS NULL LIMIT 1",
      [eventName, fileHash]
    );
    return rows[0] || null;
  }

  // Insert new photo record
  async create(data: any): Promise<any> {
    const {
      title,
      event_date,
      description,
      image_url,
      thumbnail_url,
      faculty,
      academic_year,
      file_hash,
      user_id,
      created_by,
      event_id,
    } = data;

    const [result]: any = await pool.query(
      `INSERT INTO photos
        (event_name, event_id, event_date, description, image_url,
         thumbnail_url, faculty, academic_year, file_hash, user_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        event_id ?? null,
        event_date,
        description,
        image_url,
        thumbnail_url,
        faculty,
        academic_year,
        file_hash,
        user_id,
        created_by,
      ]
    );
    return { id: result.insertId, ...data };
  }

  // Find photo by primary key
  async findById(id: number): Promise<any | null> {
    const [rows]: any = await pool.query(
      "SELECT * FROM photos WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return rows[0] || null;
  }

  // Update photo fields (only provided fields)
  async update(id: number, data: any): Promise<boolean> {
    const fieldMap: Record<string, string> = {
      title: "event_name",
    };

    const fields = Object.keys(data).filter((key) => data[key] !== undefined);
    if (fields.length === 0) return false;

    const sets = fields
      .map((field) => `${fieldMap[field] ?? field} = ?`)
      .join(", ");
    const values = fields.map((field) => data[field]);

    const [result]: any = await pool.query(
      `UPDATE photos SET ${sets} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows > 0;
  }

  // Hard delete (removes file record permanently)
  async hardDelete(id: number): Promise<boolean> {
    const [result]: any = await pool.query(
      "DELETE FROM photos WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  // Get all non-deleted photos
  async findAllActive(): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*,
        COALESCE(e.event_name, p.event_name) AS display_title,
        e.event_name AS event_name_from_events
       FROM photos p
       LEFT JOIN events e ON p.event_id = e.id
       WHERE p.deleted_at IS NULL
       ORDER BY p.created_at DESC`
    );
    return rows;
  }

  // Get all photos (admin use)
  async findAll(): Promise<any[]> {
    const [rows] = await pool.query(
      "SELECT * FROM photos WHERE deleted_at IS NULL"
    );
    return rows as any[];
  }

  // Get photos by event ID with optional filters, paginated
  async findByEventAndCategory(
    eventId: number,
    faculty?: string | null,
    academicYear?: string | null,
    limit = 20,
    offset = 0
  ): Promise<any[]> {
    let sql = "SELECT * FROM photos WHERE event_id = ? AND deleted_at IS NULL";
    const params: any[] = [eventId];

    if (faculty && faculty !== "") {
      sql += " AND faculty = ?";
      params.push(faculty);
    }
    if (academicYear && academicYear !== "") {
      sql += " AND academic_year = ?";
      params.push(academicYear);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    return rows as any[];
  }

  // Count photos by event ID with optional filters
  async countByEventAndCategory(
    eventId: number,
    faculty?: string | null,
    academicYear?: string | null
  ): Promise<number> {
    let sql =
      "SELECT COUNT(*) as total FROM photos WHERE event_id = ? AND deleted_at IS NULL";
    const params: any[] = [eventId];

    if (faculty && faculty !== "") {
      sql += " AND faculty = ?";
      params.push(faculty);
    }
    if (academicYear && academicYear !== "") {
      sql += " AND academic_year = ?";
      params.push(academicYear);
    }

    const [rows]: any = await pool.query(sql, params);
    return rows[0]?.total || 0;
  }

  async getFacultiesByEvent(eventId: number): Promise<string[]> {
    const [rows]: any = await pool.query(
      "SELECT DISTINCT faculty FROM photos WHERE event_id = ? AND deleted_at IS NULL AND faculty IS NOT NULL",
      [eventId]
    );
    return rows.map((r: any) => r.faculty || "ไม่ระบุ");
  }

  async getAcademicYearsByEvent(eventId: number): Promise<string[]> {
    const [rows]: any = await pool.query(
      "SELECT DISTINCT academic_year FROM photos WHERE event_id = ? AND deleted_at IS NULL AND academic_year IS NOT NULL",
      [eventId]
    );
    return rows.map((r: any) => r.academic_year || "ไม่ระบุ");
  }

  // Get photos grouped by event/faculty/year for gallery folders
  async findGroupedByEvent(limit: number, offset: number): Promise<any[]> {
    const sql = `
      SELECT
        p.event_id,
        p.event_name,
        p.faculty,
        p.academic_year,
        p.event_date,
        COUNT(p.id) AS photo_count,
        MAX(p.created_at) AS latest_upload,
        (
          SELECT GROUP_CONCAT(CONCAT(p2.id, ':', IFNULL(p2.thumbnail_url, ''), ':', p2.image_url))
          FROM photos p2
          WHERE p2.event_id = p.event_id
            AND p2.faculty <=> p.faculty
            AND p2.academic_year <=> p.academic_year
            AND p2.deleted_at IS NULL
          ORDER BY p2.created_at DESC
          LIMIT 3
        ) AS preview_raw
      FROM photos p
      WHERE p.deleted_at IS NULL AND p.event_id IS NOT NULL
      GROUP BY p.event_id, p.event_name, p.faculty, p.academic_year, p.event_date
      ORDER BY latest_upload DESC, p.event_date DESC
      LIMIT ? OFFSET ?`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [limit, offset]);

    return rows.map((row) => {
      const previews = row.preview_raw
        ? row.preview_raw.split(",").map((item: string) => {
            const [id, thumb, img] = item.split(":");
            return {
              id: parseInt(id),
              thumbnail_url: thumb || null,
              image_url: img,
            };
          })
        : [];
      return {
        event_id: row.event_id,
        event_name: row.event_name,
        faculty: row.faculty,
        academic_year: row.academic_year,
        event_date: row.event_date,
        photo_count: row.photo_count,
        previews,
      };
    });
  }

  async countGroups(): Promise<number> {
    const [rows]: any = await pool.query(
      `SELECT COUNT(DISTINCT event_id, faculty, academic_year) as total
       FROM photos WHERE deleted_at IS NULL AND event_id IS NOT NULL`
    );
    return rows[0]?.total || 0;
  }
}