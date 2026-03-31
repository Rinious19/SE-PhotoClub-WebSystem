//? Service: Activity Service (Frontend)
//@ จัดการการเรียก API สำหรับกิจกรรมโหวต

import axios from 'axios';

const API_URL = 'http://localhost:5000/api/activities';

export const ActivityService = {

  //@ ดึงกิจกรรมทั้งหมด พร้อมรองรับ filter
  getAll: async (params: {
    keyword?:  string;
    category?: string;
    status?:   string;
    dateFrom?: string;
    dateTo?:   string;
  } = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)
    );
    const response = await axios.get(API_URL, { params: cleanParams });
    return response.data;
  },

  //@ ดึงกิจกรรมเดี่ยว พร้อมรูปและผลโหวต
  getById: async (id: number) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  //@ สร้างกิจกรรมใหม่ (CLUB_PRESIDENT)
  //* context — เพิ่ม event_id, faculty, academic_year เพื่อให้ backend ดึงรูปด้วย FK แทน event_name
  create: async (data: {
    title:               string;
    description?:        string;
    category?:           string;
    event_name:          string;
    event_id:            number;
    faculty?:            string;
    academic_year?:      string;
    start_at:            string;
    end_at:              string;
    excluded_photo_ids?: number[];
  }, token: string) => {
    const response = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  //@ อัปเดตกิจกรรม (ADMIN / CLUB_PRESIDENT)
  update: async (id: number, data: {
    title?:       string;
    description?: string;
    category?:    string;
    start_at?:    string;
    end_at?:      string;
    status?:      string;
  }, token: string) => {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  //@ ลบรูปออกจากกิจกรรม
  removePhoto: async (activityId: number, activityPhotoId: number, token: string) => {
    const response = await axios.delete(
      `${API_URL}/${activityId}/photos/${activityPhotoId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};