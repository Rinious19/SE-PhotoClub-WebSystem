import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/Database";

export class PhotoRepository {
  async findDuplicateHash(eventName: string, fileHash: string): Promise<any> {
    const [rows]: any = await pool.query(
      "SELECT * FROM photos WHERE event_name = ? AND file_hash = ?",
      [eventName, fileHash],
    );
    return rows[0];
  }

  async create(data: any): Promise<any> {
    const { title, event_date, description, image_url, thumbnail_url, faculty, academic_year, file_hash, user_id, created_by, event_id } = data;
    const [result]: any = await pool.query(
      `INSERT INTO photos (event_name, event_id, event_date, description, image_url, thumbnail_url, faculty, academic_year, file_hash, user_id, created_by)  
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, event_id ?? null, event_date, description, image_url, thumbnail_url, faculty, academic_year, file_hash, user_id, created_by],
    );
    return { id: result.insertId, ...data };
  }

  async findById(id: number): Promise<any> {
    const [rows]: any = await pool.query("SELECT * FROM photos WHERE id = ?", [id]);
    return rows[0];
  }

  async update(id: number, data: any): Promise<boolean> {
    const fields = Object.keys(data).filter((key) => data[key] !== undefined);
    if (fields.length === 0) return false;
    const sets = fields.map((field) => (field === "title" ? `event_name = ?` : `${field} = ?`)).join(", ");
    const values = fields.map((field) => data[field]);
    const [result]: any = await pool.query(`UPDATE photos SET ${sets} WHERE id = ?`, [...values, id]);
    return result.affectedRows > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const [result]: any = await pool.query("DELETE FROM photos WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async findAllActive(): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, COALESCE(e.event_name, p.event_name) AS display_title, e.event_name AS event_name_from_events
      FROM photos p LEFT JOIN events e ON p.event_id = e.id WHERE p.deleted_at IS NULL ORDER BY p.created_at DESC`,
    );
    return rows;
  }

  async findAll(): Promise<any[]> {
    const [rows] = await pool.query("SELECT * FROM photos");
    return rows as any[];
  }

  // ✅ ค้นหาตรงๆ ไปเลย (ถ้าส่งมาแปลว่ากรองเป๊ะๆ ถ้าไม่ส่งคือเอาทั้งหมด)
  async findByEventAndCategory(
    eventId: number,
    faculty?: string | null,
    academicYear?: string | null,
    limit: number = 20,
    offset: number = 0,
  ): Promise<any[]> {
    let sql = "SELECT * FROM photos WHERE event_id = ?";
    const params: any[] = [eventId];

    if (faculty && faculty !== "") {
      sql += " AND faculty = ?";
      params.push(faculty);
    }
    if (academicYear && academicYear !== "") {
      sql += " AND academic_year = ?";
      params.push(academicYear);
    }

    sql += " AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    const [rows] = await pool.query(sql, params);
    return rows as any[];
  }

  // ✅ นับจำนวนตรงๆ
  async countByEventAndCategory(
    eventId: number,
    faculty?: string | null,
    academicYear?: string | null,
  ): Promise<number> {
    let sql = "SELECT COUNT(*) as total FROM photos WHERE event_id = ?";
    const params: any[] = [eventId];

    if (faculty && faculty !== "") {
      sql += " AND faculty = ?";
      params.push(faculty);
    }
    if (academicYear && academicYear !== "") {
      sql += " AND academic_year = ?";
      params.push(academicYear);
    }

    sql += " AND deleted_at IS NULL";
    const [rows]: any = await pool.query(sql, params);
    return rows[0]?.total || 0;
  }

  async getFacultiesByEvent(eventId: number): Promise<string[]> {
    const [rows]: any = await pool.query(
      "SELECT DISTINCT faculty FROM photos WHERE event_id = ? AND deleted_at IS NULL",
      [eventId],
    );
    return rows.map((r: any) => r.faculty || 'ไม่ระบุ');
  }

  async getAcademicYearsByEvent(eventId: number): Promise<string[]> {
    const [rows]: any = await pool.query(
      "SELECT DISTINCT academic_year FROM photos WHERE event_id = ? AND deleted_at IS NULL",
      [eventId],
    );
    return rows.map((r: any) => r.academic_year || 'ไม่ระบุ');
  }

  // ✅ Group ตรงๆ ได้เลย ไม่ต้องใช้ IFNULL แล้ว
  async findGroupedByEvent(limit: number, offset: number): Promise<any[]> {
    const sql = `
      SELECT  
        p.event_id, p.event_name, p.faculty, p.academic_year, p.event_date,
        COUNT(p.id) AS photo_count, MAX(p.created_at) AS latest_upload,
        (
          SELECT GROUP_CONCAT(CONCAT(p2.id, ':', IFNULL(p2.thumbnail_url, ''), ':', p2.image_url))
          FROM photos p2
          WHERE p2.event_id = p.event_id  
            AND p2.faculty = p.faculty
            AND p2.academic_year = p.academic_year
            AND p2.deleted_at IS NULL
          ORDER BY p2.created_at DESC LIMIT 3
        ) AS preview_raw
      FROM photos p WHERE p.deleted_at IS NULL
      GROUP BY p.event_id, p.event_name, p.faculty, p.academic_year, p.event_date
      ORDER BY latest_upload DESC, p.event_date DESC LIMIT ? OFFSET ?`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [limit, offset]);
    return rows.map((row) => {
      const previews = row.preview_raw ? row.preview_raw.split(",").map((item: string) => {
        const [id, thumb, img] = item.split(":");
        return { id: parseInt(id), thumbnail_url: thumb || null, image_url: img };
      }) : [];
      return {
        event_id: row.event_id, event_name: row.event_name, faculty: row.faculty,
        academic_year: row.academic_year, event_date: row.event_date, photo_count: row.photo_count, previews,
      };
    });
  }

  async countGroups(): Promise<number> {
    const [rows]: any = await pool.query("SELECT COUNT(DISTINCT event_id, faculty, academic_year) as total FROM photos WHERE deleted_at IS NULL");
    return rows[0]?.total || 0;
  }
}