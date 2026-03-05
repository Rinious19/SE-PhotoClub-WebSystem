import { pool } from '../config/Database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

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

  // ✅ ใช้ STR_TO_DATE เพื่อบังคับให้ MySQL อ่าน string เป็น DATE โดยตรง
  //    ไม่ผ่าน JavaScript Date object → ไม่มีปัญหา timezone เด็ดขาด
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

    const oldName = oldRows[0].event_name;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query<ResultSetHeader>(
        "UPDATE events SET event_name = ?, event_date = STR_TO_DATE(?, '%Y-%m-%d') WHERE id = ?",
        [data.event_name, data.event_date, id]
      );

      const [cr] = await connection.query<ResultSetHeader>(
        "UPDATE photos SET title = ?, event_date = STR_TO_DATE(?, '%Y-%m-%d') WHERE title = ? AND deleted_at IS NULL",
        [data.event_name, data.event_date, oldName]
      );
      console.log(`[Cascade Update] "${oldName}" → "${data.event_name}" : ${cr.affectedRows} รูป`);

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

    const eventName = rows[0].event_name;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [dr] = await connection.query<ResultSetHeader>(
        "UPDATE photos SET deleted_at = NOW() WHERE title = ? AND deleted_at IS NULL", [eventName]
      );
      console.log(`[Cascade Delete] ลบรูป ${dr.affectedRows} รูปจาก "${eventName}"`);
      await connection.query<ResultSetHeader>("DELETE FROM events WHERE id = ?", [id]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async countPhotosByEventName(eventName: string): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM photos WHERE title = ? AND deleted_at IS NULL", [eventName]
    );
    return rows[0].count;
  }
}