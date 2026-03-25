//? Model: Vote
//@ โครงสร้างข้อมูลของการโหวต ตรงกับ schema ในตาราง votes

export interface Vote {
  id?:          number;
  activity_id:  number; // กิจกรรมที่โหวต
  photo_id:     number; // id ใน activity_photos (ไม่ใช่ photos.id โดยตรง)
  user_id:      number; // ผู้โหวต
  voted_at?:    Date;
}