import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/Database';

export class PhotoRepository {
  // [1] ค้นหารูปซ้ำจาก File Hash
  async findDuplicateHash(eventName: string, fileHash: string): Promise<any> {
    const [rows]: any = await pool.query(
      "SELECT * FROM photos WHERE event_name = ? AND file_hash = ?",
      [eventName, fileHash]
    );
    return rows[0];
  }

  // [2] สร้างข้อมูลรูปภาพใหม่
  async create(data: any): Promise<any> {
    const { title, event_date, description, image_url, thumbnail_url, faculty, academic_year, file_hash, user_id, created_by } = data;
    const [result]: any = await pool.query(
      `INSERT INTO photos (event_name, event_date, description, image_url, thumbnail_url, faculty, academic_year, file_hash, user_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, event_date, description, image_url, thumbnail_url, faculty, academic_year, file_hash, user_id, created_by]
    );
    return { id: result.insertId, ...data };
  }

  // [3] ค้นหาด้วย ID
  async findById(id: number): Promise<any> {
    const [rows]: any = await pool.query("SELECT * FROM photos WHERE id = ?", [id]);
    return rows[0];
  }

  // [4] อัปเดตข้อมูลรูปภาพ
  async update(id: number, data: any): Promise<boolean> {
    const fields = Object.keys(data).filter(key => data[key] !== undefined);
    if (fields.length === 0) return false;

    const sets = fields.map(field => {
        // เปลี่ยนชื่อ title เป็น event_name ให้ตรงกับ Database
        if(field === 'title') return `event_name = ?`;
        return `${field} = ?`;
    }).join(", ");
    
    const values = fields.map(field => data[field]);
    const [result]: any = await pool.query(`UPDATE photos SET ${sets} WHERE id = ?`, [...values, id]);
    return result.affectedRows > 0;
  }

  // [5] ลบรูปถาวร
  async hardDelete(id: number): Promise<boolean> {
    const [result]: any = await pool.query("DELETE FROM photos WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  // [6] ดึงรูปที่ Active ทั้งหมด
  async findAllActive(): Promise<any[]> {
    const [rows] = await pool.query("SELECT * FROM photos WHERE status = 'active' ORDER BY created_at DESC");
    return rows as any[];
  }

  // [7] ดึงรูปทั้งหมด
  async findAll(): Promise<any[]> {
    const [rows] = await pool.query("SELECT * FROM photos");
    return rows as any[];
  }

  // [8] ดึงรูปตามกิจกรรมและหมวดหมู่
  async findByEventAndCategory(eventName: string, category: string | null, limit: number, offset: number): Promise<any[]> {
    let sql = "SELECT * FROM photos WHERE event_name = ?";
    const params: any[] = [eventName];
    if (category) {
      sql += " AND faculty = ?"; // ใช้คอลัมน์ faculty แทน category
      params.push(category);
    }
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const [rows] = await pool.query(sql, params);
    return rows as any[];
  }

  // [9] นับจำนวนรูปตามกิจกรรม
  async countByEventAndCategory(eventName: string, category: string | null): Promise<number> {
    let sql = "SELECT COUNT(*) as total FROM photos WHERE event_name = ?";
    const params: any[] = [eventName];
    if (category) {
      sql += " AND faculty = ?";
      params.push(category);
    }
    const [rows]: any = await pool.query(sql, params);
    return rows[0]?.total || 0;
  }

  // [10] ดึงรายการคณะในอีเว้นท์นั้นๆ
  async getFacultiesByEvent(eventName: string): Promise<string[]> {
    const [rows]: any = await pool.query("SELECT DISTINCT faculty FROM photos WHERE event_name = ? AND faculty IS NOT NULL", [eventName]);
    return rows.map((r: any) => r.faculty);
  }

  // [11] ดึงปีการศึกษาในอีเว้นท์นั้นๆ
  async getAcademicYearsByEvent(eventName: string): Promise<string[]> {
    const [rows]: any = await pool.query("SELECT DISTINCT academic_year FROM photos WHERE event_name = ? AND academic_year IS NOT NULL", [eventName]);
    return rows.map((r: any) => r.academic_year);
  }
  async findGroupedByEvent(limit: number, offset: number): Promise<any[]> {
    const sql = `
      SELECT 
        event_name, 
        COUNT(*) as photo_count,
        MAX(created_at) as latest_upload,
        -- ใช้ Subquery ดึง URL 5 รูปล่าสุดมาต่อกันเป็น String โดยใช้เครื่องหมาย , คั่น
        (SELECT GROUP_CONCAT(thumbnail_url ORDER BY created_at DESC) 
         FROM (
           SELECT thumbnail_url, event_name, created_at 
           FROM photos 
           ORDER BY created_at DESC 
         ) AS sub 
         WHERE sub.event_name = photos.event_name 
         LIMIT 5) as preview_urls
      FROM photos 
      GROUP BY event_name 
      ORDER BY latest_upload DESC
      LIMIT ? OFFSET ?`;
      
    const [rows] = await pool.query<RowDataPacket[]>(sql, [limit, offset]);
    
    // แปลง String ของ URL ให้กลายเป็น Array เพื่อให้ Frontend วน Loop ง่ายๆ
    return rows.map(row => ({
      ...row,
      preview_urls: row.preview_urls ? row.preview_urls.split(',') : []
    }));
  }
  
  // 2. นับจำนวนกลุ่มกิจกรรมทั้งหมด (เพื่อทำ Pagination)
  async countGroups(): Promise<number> {
   const [rows]: any = await pool.query(
    "SELECT COUNT(DISTINCT event_name) as total FROM photos"
   );
   return rows[0]?.total || 0;
  }
}