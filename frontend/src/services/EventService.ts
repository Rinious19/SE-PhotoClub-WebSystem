// frontend/src/services/EventService.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/events';

export const EventService = {
  // 🌟 [1] ดึงข้อมูลกิจกรรมทั้งหมดจากตาราง events ใน Database
  getAll: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data; // คาดหวัง { success: true, data: [...] }
    } catch (error: any) {
      console.error("Fetch Events Error:", error);
      throw error;
    }
  },

  // 🌟 [2] สร้างกิจกรรมใหม่ (สำหรับปุ่ม + Add ในหน้า Upload/Edit)
  create: async (eventData: { event_name: string; event_date: string }, token: string) => {
    try {
      const response = await axios.post(API_URL, eventData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Create Event Error:", error);
      throw error;
    }
  }
};