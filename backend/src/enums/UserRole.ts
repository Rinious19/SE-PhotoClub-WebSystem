//? Enum: User Role
//@ กำหนดสิทธิ์ของผู้ใช้งานในระบบ PhotoClub

//* context (ใช้ Enum เพื่อป้องกันการพิมพ์ Role ผิดพลาดในอนาคต)
export enum UserRole {
  GUEST = 'GUEST',                   // ผู้เยี่ยมชมทั่วไป
  EXTERNAL_USER = 'EXTERNAL_USER',   // ผู้ใช้งานภายนอกที่สมัครสมาชิกแล้ว
  ADMIN = 'ADMIN',                   // ผู้ดูแลระบบ
  CLUB_PRESIDENT = 'CLUB_PRESIDENT'  // ประธานชมรมถ่ายภาพ
}