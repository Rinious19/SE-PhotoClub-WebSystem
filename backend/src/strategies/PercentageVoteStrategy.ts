//? Strategy: PercentageVoteStrategy
//@ คำนวณเปอร์เซ็นต์ที่แต่ละรูปได้รับจากโหวตทั้งหมด
//  เรียงลำดับจาก % สูงสุดไปต่ำสุด เหมาะใช้แสดงผลบนหน้า ENDED

import { VoteStrategy, VoteResult } from './VoteStrategy';

export class PercentageVoteStrategy implements VoteStrategy {
  readonly name = 'PercentageVoteStrategy';

  calculate(results: VoteResult[]): VoteResult[] {
    //@ คำนวณ total โหวตทั้งหมดของกิจกรรม
    const total = results.reduce((sum, r) => sum + r.vote_count, 0);

    //* เพิ่มฟิลด์ percentage ในแต่ละผลลัพธ์
    const withPercentage = results.map((r) => ({
      ...r,
      // ถ้าไม่มีใครโหวตเลย → 0%
      percentage: total > 0 ? Math.round((r.vote_count / total) * 100) : 0,
    }));

    // เรียงจาก % มากไปน้อย
    return withPercentage.sort((a, b) => b.vote_count - a.vote_count);
  }
}