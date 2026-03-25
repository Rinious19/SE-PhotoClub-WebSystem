//? Service: Admin Service (Frontend)
//@ เรียก API /api/admin สำหรับ ManageAdminPage และ HistoryPage

import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const AdminService = {

  //@ ดึง User ทั้งหมด
  getAllUsers: async (token: string) => {
    const res = await axios.get(`${API_URL}/users`, {
      headers: authHeader(token),
    });
    return res.data;
  },

  //@ เปลี่ยน Role
  changeRole: async (userId: number, role: string, token: string) => {
    const res = await axios.patch(
      `${API_URL}/users/${userId}/role`,
      { role },
      { headers: { ...authHeader(token), 'Content-Type': 'application/json' } }
    );
    return res.data;
  },

  //@ ลบ User (Soft delete)
  deleteUser: async (userId: number, token: string) => {
    const res = await axios.delete(`${API_URL}/users/${userId}`, {
      headers: authHeader(token),
    });
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
      headers: authHeader(token),
      params:  queryParams,
    });
    return res.data;
  },
};