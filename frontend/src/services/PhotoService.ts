// frontend/src/services/PhotoService.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/photos'; 
const ADMIN_API_URL = 'http://localhost:5000/api/admin'; 

export const PhotoService = {
  // ดึงข้อมูลรูปภาพทั้งหมด
  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  
  // ฟังก์ชันอัปโหลดรูปภาพใหม่
  upload: async (data: FormData, token: string) => {
    const response = await axios.post(API_URL, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // 🌟 จำเป็นสำหรับการส่งไฟล์
      },
    });
    return response.data;
  },

  // ฟังก์ชันลบรูปภาพ (Soft Delete)
  delete: async (id: number, token: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // 🌟 ฟังก์ชันแก้ไขรูปภาพ (ปรับปรุงให้รองรับ FormData)
  update: async (id: number, data: FormData, token: string) => {
    // แก้ไข: เพิ่ม 'Content-Type': 'multipart/form-data' เพื่อให้ส่งไฟล์ภาพใหม่ได้
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // 🌟 สำคัญมากสำหรับระบบ BLOB
      }
    });
    return response.data;
  }
};