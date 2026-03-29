//? Utility: Role Checker
//@ ฟังก์ชันตัวช่วยสำหรับตรวจสอบสิทธิ์ (Role) ของผู้ใช้งาน

import type { User, UserRole } from '@/types/User';

//* context (ฟังก์ชันนี้ใช้ตรวจสอบว่า User มีสิทธิ์ตรงกับ Array ของ Role ที่อนุญาตหรือไม่)
export const hasRequiredRole = (
  user: User | null,
  allowedRoles: UserRole[]
): boolean => {
  if (!user) return false;
  return allowedRoles.includes(user.role);
  //! ลบ .toUpperCase() ออก เพราะ UserRole เป็น Union Type ตัวพิมพ์ตรงอยู่แล้ว
};

//* context (ฟังก์ชันสำเร็จรูป สำหรับเช็คว่าเป็นผู้ดูแลระบบหรือประธานชมรมหรือไม่)
export const isAdminOrPresident = (user: User | null): boolean => {
  //! ใช้ string literal ตรงๆ แทน enum เพราะ UserRole เป็น Union Type
  return hasRequiredRole(user, ['ADMIN', 'CLUB_PRESIDENT']);
};
