//? Service: Auth Service
//@ จัดการการเรียก API สำหรับ Authentication (Login, Register, Logout)

import axios from 'axios';
import type { User, UserRole } from '@/types/User';

//* context (สร้าง Interface กำหนด Type แทนการใช้ any เพื่อแก้บัค Strict Mode)
export interface RegisterData {
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: User;
}

//* context (กำหนด Base URL ของ Backend)
const API_URL = 'http://localhost:5000/api/auth';

export const AuthService = {
  // ฟังก์ชันสมัครสมาชิก
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_URL}/register`, data);
    return response.data;
  },

  // ฟังก์ชันเข้าสู่ระบบ
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_URL}/login`, data);
    
    // ถ้ามี token ตอบกลับมา ให้เซฟลง localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      try {
        //! สิ่งที่สำคัญมาก (ถอดรหัส JWT Payload เพื่อดึงสิทธิ์ผู้ใช้งานมาเก็บไว้ใน Frontend)
        const payload = JSON.parse(atob(response.data.token.split('.')[1]));
        const user: User = {
          id: payload.userId,
          username: data.username, 
          role: payload.role as UserRole
        };
        localStorage.setItem('user', JSON.stringify(user));
      } catch {
        console.error('ไม่สามารถอ่านข้อมูล Token ได้:');
      }
    }
    return response.data;
  },

  // ฟังก์ชันออกจากระบบ
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // ฟังก์ชันดึงข้อมูล User ปัจจุบัน
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  // ฟังก์ชันดึง Token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  }
};