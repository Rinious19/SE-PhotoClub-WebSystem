//? Types: Activity (Frontend)
//@ กำหนด Interface ของกิจกรรมสำหรับฝั่ง Frontend

export type ActivityStatus = 'ACTIVE' | 'UPCOMING' | 'ENDED';

//@ ข้อมูลรูปภาพในกิจกรรม (ดึงจาก activity_photos JOIN photos)
export interface ActivityPhoto {
  activity_photo_id: number; // id ในตาราง activity_photos (ใช้โหวต)
  photo_id:          number; // id ในตาราง photos จริง
  image_url:         string;
  thumbnail_url?:    string;
  photo_title?:      string;
  faculty?:          string;
  academic_year?:    string;
  vote_count:        number; // จำนวนโหวตของรูปนี้
  sort_order:        number;
}

//@ ข้อมูลกิจกรรม (ใช้ในหน้า List)
export interface Activity {
  id:           number;
  title:        string;
  description?: string;
  category?:    string;
  event_name:   string;
  start_at:     string; // ISO 8601
  end_at:       string; // ISO 8601
  status:       ActivityStatus;
  photo_count:  number;
  vote_count:   number;
  creator_name?: string;
  created_by:   number;
  created_at:   string;
  updated_at:   string;
}

//@ ข้อมูลกิจกรรมแบบเต็ม พร้อมรูปภาพ (ใช้ในหน้า Detail)
export interface ActivityDetail extends Activity {
  photos: ActivityPhoto[];
}

//@ ข้อมูลการโหวตของ user
export interface UserVote {
  activity_id: number;
  photo_id:    number; // activity_photo_id
}