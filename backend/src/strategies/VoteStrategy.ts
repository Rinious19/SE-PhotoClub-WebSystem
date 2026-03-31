//? Strategy: VoteStrategy
//@ Interface หลักของ Strategy Pattern สำหรับคำนวณผลโหวต
//  แต่ละ Strategy คำนวณ "ผู้ชนะ" ด้วย logic ที่แตกต่างกัน

export interface VoteResult {
  activity_photo_id: number;
  photo_id:          number;
  vote_count:        number;
  percentage?:       number; // ใช้ใน PercentageVoteStrategy
}

//@ Interface ที่ Strategy ทุกตัวต้องทำตาม
export interface VoteStrategy {
  //* ชื่อ Strategy (ใช้ log และ debug)
  readonly name: string;

  //* คำนวณผู้ชนะจาก array ผลโหวต
  //  คืน array เรียงลำดับจากมากไปน้อย
  calculate(results: VoteResult[]): VoteResult[];
}