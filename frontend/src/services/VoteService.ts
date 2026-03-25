//? Service: Vote Service (Frontend)
//@ จัดการการเรียก API สำหรับการโหวต

import axios from 'axios';

const API_URL = 'http://localhost:5000/api/votes';

export const VoteService = {

  //@ ส่งการโหวต
  castVote: async (data: { activity_id: number; photo_id: number }, token: string) => {
    const response = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  //@ ดึงผลโหวตของกิจกรรม
  getResults: async (activityId: number) => {
    const response = await axios.get(`${API_URL}/results/${activityId}`);
    return response.data;
  },

  //@ ดึงโหวตที่ user เคยโหวตในกิจกรรมที่ระบุ
  //  ส่ง activityIds เป็น comma-separated เพื่อ batch check ครั้งเดียว
  getMyVotes: async (activityIds: number[], token: string) => {
    if (!token || activityIds.length === 0) return { data: [] };
    const response = await axios.get(`${API_URL}/my-votes`, {
      params:  { activityIds: activityIds.join(',') },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};