//? Hook: useAuth
//@ Custom Hook สำหรับดึงข้อมูลจาก AuthContext

import { useContext } from 'react';
//* context (แยก import Type ออกมาให้ชัดเจน)
import { AuthContext, type AuthContextType } from '@/context/AuthContext';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth ต้องถูกเรียกใช้ภายในพื้นที่ของ AuthProvider เท่านั้น');
  }
  
  return context;
};