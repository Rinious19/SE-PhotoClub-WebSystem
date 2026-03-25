//? Hook: useAuth
//@ Custom Hook สำหรับดึงข้อมูลจาก AuthContext

import { useContext, useEffect } from 'react';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth ต้องถูกเรียกใช้ภายในพื้นที่ของ AuthProvider เท่านั้น');
  }

  const { isAuthenticated, logout} = context;

  // 🔥 FIX: ถ้าไม่มี token แต่ state ยังค้าง → reset
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token && isAuthenticated) {
      logout?.(); // ✅ ใช้ logout ตรง ๆ ไม่ต้องเรียก context.logout
    }
  }, [isAuthenticated, logout]); // ✅ ใส่ dependency ให้ครบ

  return context;
};