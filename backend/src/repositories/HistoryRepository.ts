//? Repository: History Log
//@ จัดการการเข้าถึง history_logs Table

import { pool } from '../config/Database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { HistoryLog, HistoryAction, HistoryTargetType } from '../models/HistoryLog';

interface HistoryRow extends RowDataPacket, HistoryLog {}

export class HistoryRepository {

  //@ บันทึก log ใหม่
  async create(log: HistoryLog): Promise<void> {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO history_logs
         (actor_id, action, target_type, target_id, detail)
       VALUES (?, ?, ?, ?, ?)`,
      [
        log.actor_id  ?? null,
        log.action,
        log.target_type,
        log.target_id ?? null,
        log.detail    ?? null,
      ]
    );
  }

  //@ ดึง log ทั้งหมด พร้อม pagination + filter
  async findAll(options: {
    page?:        number;
    limit?:       number;
    action?:      HistoryAction;
    targetType?:  HistoryTargetType;
    actorId?:     number;
  } = {}): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, action, targetType, actorId } = options;
    const offset = (page - 1) * limit;

    //* context (สร้าง WHERE clause แบบ dynamic ตาม filter ที่ส่งมา)
    const conditions: string[] = [];
    const params: any[]        = [];

    if (action)     { conditions.push('hl.action = ?');      params.push(action); }
    if (targetType) { conditions.push('hl.target_type = ?'); params.push(targetType); }
    if (actorId)    { conditions.push('hl.actor_id = ?');    params.push(actorId); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query<HistoryRow[]>(
      `SELECT
         hl.id,
         hl.actor_id,
         u.username      AS actor_name,
         hl.action,
         hl.target_type,
         hl.target_id,
         hl.detail,
         hl.created_at
       FROM history_logs hl
       LEFT JOIN users u ON u.id = hl.actor_id
       ${where}
       ORDER BY hl.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM history_logs hl ${where}`,
      params
    );

    return { data: rows, total: countRows[0].total };
  }

  //@ ดึง log ของ user คนเดียว
  async findByActorId(actorId: number, limit = 50): Promise<any[]> {
    const [rows] = await pool.query<HistoryRow[]>(
      `SELECT * FROM history_logs
       WHERE actor_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [actorId, limit]
    );
    return rows;
  }
}