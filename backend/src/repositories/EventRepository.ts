import { pool } from '../config/Database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { deletePhotoFiles } from '../middlewares/UploadMiddleware';

export interface Event {
  id?: number;
  event_name: string;
  event_date: string;
}

export class EventRepository {
  async findAll(): Promise<Event[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, event_name, DATE_FORMAT(event_date, '%Y-%m-%d') as event_date, created_at FROM events ORDER BY event_date DESC"
    );
    return rows as Event[];
  }

  async create(data: Event): Promise<any> {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO events (event_name, event_date) VALUES (?, STR_TO_DATE(?, '%Y-%m-%d'))",
      [data.event_name, data.event_date]
    );
    return { id: result.insertId, ...data };
  }

  async update(id: number, data: Partial<Event>): Promise<any> {
    const [oldRows] = await pool.query<RowDataPacket[]>(
      "SELECT event_name FROM events WHERE id = ?", [id]
    );
    if (oldRows.length === 0) throw new Error("ไม่พบกิจกรรมที่ต้องการแก้ไข");

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      //? อัปเดต events table
      await connection.query<ResultSetHeader>(
        "UPDATE events SET event_name = ?, event_date = STR_TO_DATE(?, '%Y-%m-%d') WHERE id = ?",
        [data.event_name, data.event_date, id]
      );

      //* context — sync event_name และ event_date ใน photos ด้วย event_id (FK)
      //* ไม่ใช้ title = ? เพราะ title อาจซ้ำกันข้ามอีเว้นท์ได้
      const [cr] = await connection.query<ResultSetHeader>(
        "UPDATE photos SET event_name = ?, event_date = STR_TO_DATE(?, '%Y-%m-%d') WHERE event_id = ? AND deleted_at IS NULL",
        [data.event_name, data.event_date, id]
      );
      console.log(`[Cascade Update] event_id=${id} → "${data.event_name}" : ${cr.affectedRows} รูป`);

      await connection.commit();
      return { id, ...data };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async delete(id: number): Promise<void> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT event_name FROM events WHERE id = ?", [id]
    );
    if (rows.length === 0) throw new Error("ไม่พบกิจกรรมที่ต้องการลบ");

    //* context — ดึงรูปด้วย event_id (FK) ไม่ใช่ title = event_name
    const [photoRows] = await pool.query<RowDataPacket[]>(
      "SELECT image_url, thumbnail_url FROM photos WHERE event_id = ? AND deleted_at IS NULL",
      [id]
    );

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      //? Hard delete รูปทั้งหมดใน event นี้ด้วย event_id
      const [dr] = await connection.query<ResultSetHeader>(
        "DELETE FROM photos WHERE event_id = ? AND deleted_at IS NULL", [id]
      );
      console.log(`[Cascade Delete] ลบรูป ${dr.affectedRows} รูปจาก event_id=${id}`);

      await connection.query<ResultSetHeader>("DELETE FROM events WHERE id = ?", [id]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    //@ ลบไฟล์บน disk หลัง transaction สำเร็จ
    for (const photo of photoRows as any[]) {
      deletePhotoFiles(photo.image_url, photo.thumbnail_url);
    }
    console.log(`[Cascade Delete] ลบไฟล์ ${photoRows.length} ไฟล์จาก disk`);
  }

  //* context — นับรูปด้วย event_id แทน event_name string
  async countPhotosByEventName(eventName: string): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count 
       FROM photos p
       JOIN events e ON p.event_id = e.id
       WHERE e.event_name = ? AND p.deleted_at IS NULL`,
      [eventName]
    );
    return rows[0].count;
  }

  //* context — นับรูปด้วย event_id โดยตรง (ใช้ใน EventController)
  async countPhotosByEventId(eventId: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM photos WHERE event_id = ? AND deleted_at IS NULL",
      [eventId]
    );
    return rows[0].count;
  }
}