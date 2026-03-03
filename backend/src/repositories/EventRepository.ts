import { pool } from '../config/Database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface Event {
  id?: number;
  event_name: string;
  event_date: string;
}

export class EventRepository {
  // ดึงกิจกรรมทั้งหมด
  async findAll(): Promise<Event[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM events ORDER BY event_date DESC"
    );
    return rows as Event[];
  }

  // สร้างกิจกรรมใหม่
  async create(data: Event): Promise<any> {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO events (event_name, event_date) VALUES (?, ?)",
      [data.event_name, data.event_date]
    );
    return { id: result.insertId, ...data };
  }
}