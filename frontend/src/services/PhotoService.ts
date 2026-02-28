// frontend/src/services/PhotoService.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/photos'; // ปรับ URL ให้ตรงกับ Backend ของคุณ
const ADMIN_API_URL = 'http://localhost:5000/api/admin'; // URL ของ Admin

export const PhotoService = {
  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  
  upload: async (photoData: any, token: string) => {
    const response = await axios.post(`${API_URL}/upload`, photoData, {
      headers: { Authorization: `Bearer ${token}` }
    }); // ✅ ปิดวงเล็บของ axios.post ตรงนี้
    return response.data; // ✅ ต้องมี return ของ upload
  }, // ✅ ปิดปีกกาของฟังก์ชัน upload และคั่นด้วยลูกน้ำ (,)

  // ฟังก์ชันลบรูปภาพ (ยิงไปที่ ADMIN_API_URL)
  delete: async (id: number, token: string) => {
    const response = await axios.delete(`${ADMIN_API_URL}/delete/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
// ฟังก์ชันแก้ไขรูปภาพ
  update: async (id: number, photoData: any, token: string) => {
    const response = await axios.put(`${ADMIN_API_URL}/update/${id}`, photoData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};