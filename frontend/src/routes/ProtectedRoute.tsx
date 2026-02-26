//? Route Guard: Protected Route
//@ ใช้ห่อหุ้ม (Wrap) Route ที่ต้องการให้เฉพาะสมาชิกที่ล็อกอินแล้วเข้าถึงได้

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  //! สิ่งที่สำคัญมาก (ใช้ replace เพื่อไม่ให้ User กด Back กลับมาหน้าเดิมที่ถูก Redirect มาได้)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ถ้าล็อกอินแล้ว ให้แสดงเนื้อหาของ Route ลูก (Outlet คือช่องว่างสำหรับเสียบ Component ลูก)
  return <Outlet />;
};