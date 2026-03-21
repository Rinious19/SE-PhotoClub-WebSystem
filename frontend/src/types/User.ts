//? Types: User & Role
//@ กำหนดรูปแบบข้อมูลของผู้ใช้งานในระบบสำหรับฝั่ง Frontend

//* context (แก้บัค erasableSyntaxOnly: เราจะไม่ใช้ enum แต่จะใช้ Union Type แทน เพื่อให้ลบออกได้ 100% ตอน Build)
export type UserRole = 'GUEST' | 'EXTERNAL_USER' | 'ADMIN' | 'CLUB_PRESIDENT';

//* context (Interface สำหรับเก็บข้อมูล User หลังจาก Login สำเร็จ)
export interface User {
  id: number;
  username: string;
  role: UserRole;
  //! สิ่งที่สำคัญมาก (ฝั่ง Frontend ไม่ควรมีฟิลด์ password_hash เด็ดขาด เพื่อความปลอดภัย)
}