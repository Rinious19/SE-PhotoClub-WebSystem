//? Context: Auth Context
//@ จัดการ State ของผู้ใช้งานให้ Component อื่นๆ เรียกใช้ได้ทั่วทั้งแอปพลิเคชัน

import { createContext, useState, type ReactNode } from 'react';
//* context (แยก import Type ออกมาด้วยคำว่า type ตามกฎ verbatimModuleSyntax)
import { AuthService, type LoginData, type RegisterData, type AuthResponse } from '@/services/AuthService';
import type { User } from '@/types/User';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
}

//* context (ปิดแจ้งเตือน Fast Refresh เฉพาะบรรทัดนี้ เพื่อให้ Context และ Provider อยู่ไฟล์เดียวกันได้)
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  //* context (แก้บัค Cascading Renders ด้วย Lazy Initialization: อ่านค่าทันทีตอนสร้าง State)
  const [user, setUser] = useState<User | null>(() => AuthService.getCurrentUser());

  const login = async (data: LoginData): Promise<AuthResponse> => {
    const response = await AuthService.login(data);
    setUser(AuthService.getCurrentUser());
    return response;
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    return await AuthService.register(data);
  };

  const logout = (): void => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};