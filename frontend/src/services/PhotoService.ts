// frontend/src/services/PhotoService.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/photos';

export const PhotoService = {
  // ดึงรูปทั้งหมด (legacy)
  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  // ✅ ดึง Folders แบบ paginated (Lazy Load folders)
  getGrouped: async (page: number = 1) => {
    const response = await axios.get(`${API_URL}/grouped`, { params: { page } });
    return response.data;
  },

  // ✅ ดึงรูปใน Event เดียว แบบ paginated (Lazy Load photos)
  getByEvent: async (eventName: string, page: number = 1, faculty?: string, academicYear?: string) => {
    const params: any = { page };
    if (faculty)      params.faculty       = faculty;
    if (academicYear) params.academic_year = academicYear;
    const response = await axios.get(`${API_URL}/by-event/${encodeURIComponent(eventName)}`, { params });
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