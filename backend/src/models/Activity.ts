//? Model: Activity
//@ โครงสร้างข้อมูลของกิจกรรมโหวต ตรงกับ schema ในตาราง activities

import { ActivityStatus } from '../enums/ActivityStatus';

export interface Activity {
  id?:          number;
  title:        string;         // ชื่อกิจกรรม
  description?: string;         // คำอธิบาย (optional)
  category?:    string;         // ประเภท เช่น คณะวิศวกรรมศาสตร์
  event_name:   string;         // อีเว้นท์ต้นทางที่ดึงรูปมา
  start_at:     Date | string;  // วันเวลาเริ่มต้น
  end_at:       Date | string;  // วันเวลาสิ้นสุด
  status:       ActivityStatus; // UPCOMING | ACTIVE | ENDED
  created_by:   number;         // user_id ของผู้สร้าง
  created_at?:  Date;
  updated_at?:  Date;
}