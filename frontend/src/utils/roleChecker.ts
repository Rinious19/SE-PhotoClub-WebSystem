//? Utility: Role Checker
//@ ฟังก์ชันตัวช่วยสำหรับตรวจสอบสิทธิ์ (Role) ของผู้ใช้งาน

import type { User, UserRole } from '@/types/User';

//* context (ฟังก์ชันนี้ใช้ตรวจสอบว่า User มีสิทธิ์ตรงกับ Array ของ Role ที่อนุญาตหรือไม่)
export const hasRequiredRole = (user: User | null, allowedRoles: UserRole[]): boolean => {
  //! สิ่งที่สำคัญมาก (ถ้าค่า user เป็น null หรือ undefined แปลว่ายังไม่ได้ล็อกอิน ให้เตะออก หรือ return false ทันที)
  if (!user) {
    return false;
  }
  
  return allowedRoles.includes(user.role);
};

//* context (ฟังก์ชันสำเร็จรูป สำหรับเช็คว่าเป็นผู้ดูแลระบบหรือประธานชมรมหรือไม่ จะได้ไม่ต้องส่ง Array ยาวๆ บ่อยๆ)
export const isAdminOrPresident = (user: User | null): boolean => {
  return hasRequiredRole(user, ['ADMIN', 'CLUB_PRESIDENT']);
};