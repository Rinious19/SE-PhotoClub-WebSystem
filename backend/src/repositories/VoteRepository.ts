//? Repository: Vote
//@ SQL สำหรับตาราง votes (schema จริงหลัง ALTER)
//  votes.activity_photo_id → FK activity_photos.id
//  UNIQUE(activity_photo_id, activity_id, user_id) → 1 user = 1 โหวตต่อกิจกรรม

import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/Database';
import { Vote } from '../models/Vote';

export class VoteRepository {

  //@ ตรวจว่า user โหวตในกิจกรรมนี้ไปแล้วหรือยัง
  async findUserVote(activityId: number, userId: number): Promise<Vote | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM votes
       WHERE activity_id = ? AND user_id = ?
       LIMIT 1`,
      [activityId, userId]
    );
    return rows.length > 0 ? (rows[0] as Vote) : null;
  }

  //@ บันทึกโหวต
  //! DB จะ throw error ถ้า user โหวตซ้ำ (UNIQUE constraint) → Service จัดการ
  async create(vote: Vote): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO votes (activity_photo_id, activity_id, user_id) VALUES (?, ?, ?)`,
      [vote.photo_id, vote.activity_id, vote.user_id]
    );
    return result.insertId;
  }

  //@ ผลโหวตของกิจกรรม — จำนวนโหวตของแต่ละรูป
  async getVoteResults(activityId: number): Promise<Array<{
    activity_photo_id: number;
    photo_id:          number;
    vote_count:        number;
  }>> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         ap.id        AS activity_photo_id,
         ap.photo_id,
         COUNT(v.id)  AS vote_count
       FROM activity_photos ap
       LEFT JOIN votes v
         ON v.activity_id = ap.activity_id
         AND v.activity_photo_id = ap.id
       WHERE ap.activity_id = ?
       GROUP BY ap.id
       ORDER BY vote_count DESC`,
      [activityId]
    );
    return rows as any[];
  }

  //@ batch-check โหวตของ user ในหลายกิจกรรม (ใช้ใน ActivityListPage)
  async findUserVotesForActivities(
    userId: number,
    activityIds: number[]
  ): Promise<Array<{ activity_id: number; photo_id: number }>> {
    if (activityIds.length === 0) return [];
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT activity_id, activity_photo_id AS photo_id
       FROM votes
       WHERE user_id = ? AND activity_id IN (?)`,
      [userId, activityIds]
    );
    return rows as any[];
  }
}