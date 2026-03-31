//? Types: Vote (Frontend)
//@ กำหนด Interface ของข้อมูลโหวตสำหรับฝั่ง Frontend

export interface Vote {
  id?:         number;
  activity_id: number; // กิจกรรมที่โหวต
  photo_id:    number; // activity_photo_id ที่โหวตให้
  user_id?:    number;
  voted_at?:   string;
}