//? Service: Admin Service (Frontend)
//@ เรียก API /api/admin สำหรับ ManageAdminPage และ HistoryPage

import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin`;

// Helper สำหรับจัดการ Auth Header
const authHeader = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  }
});

export const AdminService = {

  //@ ดึง User ทั้งหมด
  getAllUsers: async (token: string) => {
    const res = await axios.get(`${API_URL}/users`, authHeader(token));
    return res.data;
  },

  //@ เปลี่ยน Role (ใช้ PATCH)
  changeRole: async (userId: number, role: string, token: string) => {
    const res = await axios.patch(
      `${API_URL}/users/${userId}/role`,
      { role },
      { 
        ...authHeader(token),
        headers: { 
          ...authHeader(token).headers, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    return res.data;
  },

  //@ ระงับผู้ใช้งาน (Soft Delete - เปลี่ยน Role เป็น GUEST)
  deleteUser: async (userId: number, token: string) => {
    const res = await axios.delete(`${API_URL}/users/${userId}`, authHeader(token));
    return res.data;
  },

  //@ ลบผู้ใช้งานถาวร (Hard Delete - ลบออกจาก DB)
  // [Added] ฟังก์ชันนี้จะเรียกไปที่ route /users/:id/permanent ที่คุณตั้งไว้ใน Backend
  deleteUserPermanent: async (userId: number, token: string) => {
    const res = await axios.delete(`${API_URL}/users/${userId}/permanent`, authHeader(token));
    return res.data;
  },

  //@ ดึง History Log
  getHistory: async (params: {
    page?:   number;
    limit?:  number;
    action?: string;
    type?:   string;
    token:   string;
  }) => {
    const { token, ...queryParams } = params;
    const res = await axios.get(`${API_URL}/history`, {
      ...authHeader(token),
      params: queryParams,
    });
    return res.data;
  },
};