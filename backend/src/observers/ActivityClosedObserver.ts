//? Observer: ActivityClosedObserver
//@ ระบบ Observer ที่ทำงานเมื่อกิจกรรมโหวตสิ้นสุดลง
//  ใช้ Pattern: Observer + Strategy รวมกัน
//  เมื่อกิจกรรมเปลี่ยนเป็น ENDED → คำนวณผลและบันทึก log

import { VoteRepository }          from '../repositories/VoteRepository';
import { MostVoteStrategy }        from '../strategies/MostVoteStrategy';
import { PercentageVoteStrategy }  from '../strategies/PercentageVoteStrategy';
import { VoteResult }              from '../strategies/VoteStrategy';
import { pool }                    from '../config/Database';

export class ActivityClosedObserver {
  private voteRepo            = new VoteRepository();
  //* Strategy ที่ใช้เป็นหลักในการหาผู้ชนะ
  private mostVoteStrategy    = new MostVoteStrategy();
  //* Strategy เพิ่มเติมสำหรับคำนวณ % เพื่อแสดงผล
  private percentageStrategy  = new PercentageVoteStrategy();

  //@ เรียกเมื่อกิจกรรมเปลี่ยนสถานะเป็น ENDED
  async onActivityClosed(activityId: number): Promise<void> {
    console.log(`[ActivityClosedObserver] กิจกรรม #${activityId} สิ้นสุดแล้ว — กำลังคำนวณผล`);

    try {
      // [1] ดึงผลโหวตดิบจาก DB
      const rawResults = await this.voteRepo.getVoteResults(activityId);
      if (rawResults.length === 0) {
        console.log(`[ActivityClosedObserver] ไม่มีโหวตในกิจกรรม #${activityId}`);
        return;
      }

      // [2] ใช้ MostVoteStrategy หาผู้ชนะ
      const ranked     = this.mostVoteStrategy.calculate(rawResults as VoteResult[]);
      const withPct    = this.percentageStrategy.calculate(rawResults as VoteResult[]);
      const winner     = ranked[0];

      // [3] Log ผลลัพธ์
      console.log(`[ActivityClosedObserver] ผู้ชนะ: photo_id=${winner.photo_id}, votes=${winner.vote_count}`);
      console.log('[ActivityClosedObserver] ผลทั้งหมด:', withPct.map(r =>
        `photo_id=${r.photo_id} → ${r.vote_count} votes (${r.percentage}%)`
      ).join(' | '));

      //@ บันทึก history log (ถ้ามีตาราง history_logs)
      try {
        await pool.query(
          `INSERT INTO photo_audit_logs (photo_id, action, user_id, details)
           VALUES (?, 'ACTIVITY_CLOSED', 0, ?)`,
          [
            winner.photo_id,
            JSON.stringify({
              activity_id: activityId,
              winner_photo_id:   winner.photo_id,
              winner_vote_count: winner.vote_count,
              total_results: withPct.length,
            }),
          ]
        );
      } catch {
        // ถ้า log ไม่สำเร็จ ไม่ต้อง throw เพราะไม่ใช่ critical path
        console.warn('[ActivityClosedObserver] บันทึก history log ไม่สำเร็จ');
      }

    } catch (err) {
      console.error(`[ActivityClosedObserver] Error สำหรับกิจกรรม #${activityId}:`, err);
    }
  }
}