// frontend/src/services/PhotoService.ts
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/photos`;

export const PhotoService = {
  // ดึงรูปทั้งหมด (legacy)
  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  //? ดึง Folders แบบ paginated (Lazy Load folders)
  getGrouped: async (page: number = 1) => {
    const response = await axios.get(`${API_URL}/grouped`, { params: { page } });
    return response.data;
  },

  //? [ระบบเดิม] ดึงรูปใน Event เดียว แบบ paginated — ใช้ event_id แทน event_name
  // * คงไว้เพื่อไม่ให้ฟีเจอร์อื่นที่เรียกใช้ฟังก์ชันนี้พัง
  getByEvent: async (eventId: number, page: number = 1) => {
    const response = await axios.get(`${API_URL}/event/${eventId}`, { params: { page } });
    return response.data;
  },

  //? [ระบบใหม่] ดึงรูปใน Event เดียว พร้อมรองรับการกรองตาม คณะ และ ปีการศึกษา
  // * ใช้ในหน้า EventPhotosPage ที่เราเพิ่งอัปเดตไป
  getPhotosByEvent: async (eventId: number, options: { page?: number, faculty?: string, academic_year?: string }) => {
    // axios จะแปลง object ใน params เป็น query string ให้อัตโนมัติ (ข้ามค่าที่เป็น undefined ให้เลย)
    const response = await axios.get(`${API_URL}/event/${eventId}`, { params: options });
    return response.data;
  },

  upload: async (data: FormData, token: string) => {
    const response = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number, token: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  update: async (id: number, data: FormData, token: string) => {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};