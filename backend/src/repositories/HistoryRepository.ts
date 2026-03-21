import { pool } from '../config/Database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface HistoryLog {
  id?: number;
  user_id: number;
  action: string;
  target_type: string;
  target_id?: number;
  created_at?: Date;
}

interface HistoryRow extends RowDataPacket, HistoryLog {}

export class HistoryRepository {
  async create(log: HistoryLog): Promise<HistoryLog> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO history_logs (user_id, action, target_type, target_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [log.user_id, log.action, log.target_type, log.target_id || null]
    );

    return { ...log, id: result.insertId };
  }

  async findAll(): Promise<HistoryLog[]> {
    const [rows] = await pool.execute<HistoryRow[]>(
      `SELECT * FROM history_logs ORDER BY created_at DESC`
    );

    return rows;
  }
}