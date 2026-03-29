import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/Database";

export class PhotoRepository {
  // [1] ค้นหารูปซ้ำจาก File Hash
  async findDuplicateHash(eventName: string, fileHash: string): Promise<any> {
    const [rows]: any = await pool.query(
      "SELECT * FROM photos WHERE event_name = ? AND file_hash = ?",
      [eventName, fileHash],
    );
    return rows[0];
  }

  // [2] สร้างข้อมูลรูปภาพใหม่
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
      `INSERT INTO photos (event_name, event_id, event_date, description, image_url, thumbnail_url, faculty, academic_year, file_hash, user_id, created_by) 
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
      ],
    );
    return { id: result.insertId, ...data };
  }

  // [3] ค้นหาด้วย ID
  async findById(id: number): Promise<any> {
    const [rows]: any = await pool.query("SELECT * FROM photos WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  // [4] อัปเดตข้อมูลรูปภาพ
  async update(id: number, data: any): Promise<boolean> {
    const fields = Object.keys(data).filter((key) => data[key] !== undefined);
    if (fields.length === 0) return false;

    const sets = fields
      .map((field) => {
        // เปลี่ยนชื่อ title เป็น event_name ให้ตรงกับ Database
        if (field === "title") return `event_name = ?`;
        return `${field} = ?`;
      })
      .join(", ");

    const values = fields.map((field) => data[field]);
    const [result]: any = await pool.query(
      `UPDATE photos SET ${sets} WHERE id = ?`,
      [...values, id],
    );
    return result.affectedRows > 0;
  }

  // [5] ลบรูปถาวร
  async hardDelete(id: number): Promise<boolean> {
    const [result]: any = await pool.query("DELETE FROM photos WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }

  // [6] ดึงรูปที่ Active ทั้งหมด
  async findAllActive(): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
       p.*, 
       COALESCE(e.event_name, p.event_name) AS display_title,
       e.event_name AS event_name_from_events
     FROM photos p
     LEFT JOIN events e ON p.event_id = e.id
     WHERE p.deleted_at IS NULL 
     ORDER BY p.created_at DESC`,
    );
    return rows;
  }

  // [7] ดึงรูปทั้งหมด
  async findAll(): Promise<any[]> {
    const [rows] = await pool.query("SELECT * FROM photos");
    return rows as any[];
  }

  // [8] ดึงรูปตามกิจกรรมและหมวดหมู่ — ใช้ event_id เป็น key หลัก
  async findByEventAndCategory(
    eventId: number,
    category: string | null,
    limit: number,
    offset: number,
  ): Promise<any[]> {
    //? query จาก event_id ซึ่งเป็น FK ที่แน่นอน ไม่ใช่ event_name string
    let sql = "SELECT * FROM photos WHERE event_id = ?";
    const params: any[] = [eventId];

    if (category === "NULL") {
      sql += " AND faculty IS NULL";
    } else if (category) {
      sql += " AND faculty = ?";
      params.push(category);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const [rows] = await pool.query(sql, params);
    return rows as any[];
  }

  async countByEventAndCategory(
    eventId: number,
    category: string | null,
  ): Promise<number> {
    let sql = "SELECT COUNT(*) as total FROM photos WHERE event_id = ?";
    const params: any[] = [eventId];

    if (category === "NULL") {
      sql += " AND faculty IS NULL";
    } else if (category) {
      sql += " AND faculty = ?";
      params.push(category);
    }

    const [rows]: any = await pool.query(sql, params);
    return rows[0]?.total || 0;
  }

  // [10] ดึงรายการคณะในอีเว้นท์นั้นๆ
  async getFacultiesByEvent(eventId: number): Promise<string[]> {
    const [rows]: any = await pool.query(
      "SELECT DISTINCT faculty FROM photos WHERE event_id = ? AND faculty IS NOT NULL",
      [eventId],
    );
    return rows.map((r: any) => r.faculty);
  }

  // [11] ดึงปีการศึกษาในอีเว้นท์นั้นๆ
  async getAcademicYearsByEvent(eventId: number): Promise<string[]> {
    const [rows]: any = await pool.query(
      "SELECT DISTINCT academic_year FROM photos WHERE event_id = ? AND academic_year IS NOT NULL",
      [eventId],
    );
    return rows.map((r: any) => r.academic_year);
  }

  async findGroupedByEvent(limit: number, offset: number): Promise<any[]> {
    //? findGroupedByEvent — ดึง gallery list โดย query จาก events เป็นหลัก
    //* context — LEFT JOIN photos เพื่อให้ gallery ยังแสดงอยู่แม้ไม่มีรูปเหลือ
    const sql = `
      SELECT 
        e.id          AS event_id,
        e.event_name,
        e.event_date,
        COUNT(p.id)   AS photo_count,
        MAX(p.created_at) AS latest_upload,
        (
          SELECT GROUP_CONCAT(CONCAT(p2.id, ':', IFNULL(p2.thumbnail_url, ''), ':', p2.image_url))
          FROM photos p2
          WHERE p2.event_id = e.id
          ORDER BY p2.created_at DESC
          LIMIT 3
        ) AS preview_raw
      FROM events e
      LEFT JOIN photos p ON p.event_id = e.id
      GROUP BY e.id, e.event_name, e.event_date
      ORDER BY latest_upload DESC, e.event_date DESC
      LIMIT ? OFFSET ?`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [limit, offset]);

    //@ แปลง preview_raw string → Array of Object ตามที่ Frontend ต้องการ
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
        event_id:    row.event_id,
        event_name:  row.event_name,
        event_date:  row.event_date,
        photo_count: row.photo_count,
        previews,
      };
    });
  }

  //@ นับจำนวน gallery ทั้งหมด — นับจาก events ไม่ใช่ photos
  //* context — ทำให้ gallery ที่ไม่มีรูปยังนับรวมใน pagination ด้วย
  async countGroups(): Promise<number> {
    const [rows]: any = await pool.query(
      "SELECT COUNT(*) as total FROM events",
    );
    return rows[0]?.total || 0;
  }
}