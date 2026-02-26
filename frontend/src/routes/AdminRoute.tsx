//? Route Guard: Admin Route
//@ ใช้ห่อหุ้ม Route ที่ต้องการให้เฉพาะ ADMIN หรือ CLUB_PRESIDENT เข้าถึงได้

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isAdminOrPresident } from '@/utils/roleChecker';

export const AdminRoute = () => {
  // ดึงแค่ตัวแปรที่ใช้งานจริงมา เพื่อไม่ให้ผิดกฎ noUnusedLocals
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  //! สิ่งที่สำคัญมาก (ถ้าล็อกอินแล้วแต่ Role ไม่ถึง ให้เตะกลับไปหน้าแรก)
  if (!isAdminOrPresident(user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};