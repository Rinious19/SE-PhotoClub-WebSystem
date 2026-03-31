// frontend/src/services/EventService.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/events';

export const EventService = {
  // [1] ดึงข้อมูลอีเว้นท์ทั้งหมด
  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  // [2] สร้างอีเว้นท์ใหม่
  create: async (eventData: { event_name: string; event_date: string }, token: string) => {
    const response = await axios.post(API_URL, eventData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // [3] แก้ไขอีเว้นท์ (cascade update photos อัตโนมัติที่ backend)
  update: async (id: number, eventData: { event_name: string; event_date: string }, token: string) => {
    const response = await axios.put(`${API_URL}/${id}`, eventData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // ✅ [4] ลบอีเว้นท์ (cascade delete photos อัตโนมัติที่ backend)
  delete: async (id: number, token: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // ✅ [5] ดึงจำนวนรูปภาพที่ผูกกับ event (แก้ไข: ให้รับ eventId เป็น number เพื่อให้ตรงกับ Backend)
  getPhotoCount: async (eventId: number) => {
    const response = await axios.get(`${API_URL}/photo-count`, {
      params: { event_id: eventId },
    });
    return response.data;
  },
};