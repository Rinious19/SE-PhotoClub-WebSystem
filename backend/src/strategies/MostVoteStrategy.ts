//? Strategy: MostVoteStrategy
//@ ผู้ชนะคือรูปที่ได้รับโหวตมากที่สุด (default strategy)
//  ถ้า vote เท่ากัน → เรียงตาม activity_photo_id (อัปโหลดก่อนได้เปรียบ)

import { VoteStrategy, VoteResult } from './VoteStrategy';

export class MostVoteStrategy implements VoteStrategy {
  readonly name = 'MostVoteStrategy';

  //@ เรียงลำดับจากโหวตมากไปน้อย
  calculate(results: VoteResult[]): VoteResult[] {
    return [...results].sort((a, b) => {
      // ถ้าโหวตเท่ากัน ให้รูปที่อัปโหลดก่อน (id น้อยกว่า) ชนะ
      if (b.vote_count !== a.vote_count) {
        return b.vote_count - a.vote_count;
      }
      return a.activity_photo_id - b.activity_photo_id;
    });
  }
}