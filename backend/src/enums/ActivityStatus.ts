//? Enum: Activity Status
//@ สถานะของกิจกรรมโหวต — ใช้ทั้งฝั่ง Backend และ Frontend

export enum ActivityStatus {
  UPCOMING = 'UPCOMING', // รอเปิดกิจกรรม (ยังไม่ถึง start_at)
  ACTIVE   = 'ACTIVE',   // กำลังดำเนินการ สามารถโหวตได้
  ENDED    = 'ENDED',    // สิ้นสุดแล้ว ดูผลได้แต่โหวตไม่ได้
}