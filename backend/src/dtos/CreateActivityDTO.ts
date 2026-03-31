//? DTO: Create Activity
//@ รูปแบบข้อมูลที่รับจาก Frontend ตอนสร้างกิจกรรมโหวต
//  ใช้โดย CLUB_PRESIDENT เท่านั้น

export interface CreateActivityDTO {
  title:        string;   // ชื่อกิจกรรม
  description?: string;   // คำอธิบาย (optional)
  category?:    string;   // ประเภทกิจกรรม
  event_name:   string;   // อีเว้นท์ต้นทาง
  start_at:     string;   // ISO 8601 เช่น "2025-08-01T09:00:00"
  end_at:       string;   // ISO 8601 เช่น "2025-08-07T23:59:00"

  //! สำคัญ: excluded_photo_ids = รายการ photos.id ที่ CLUB_PRESIDENT เลือกเอาออก
  excluded_photo_ids?: number[];
}