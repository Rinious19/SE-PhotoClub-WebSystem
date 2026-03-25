//? DTO: Create Photo
//@ กำหนดโครงสร้างข้อมูลที่รับจาก Request ตอนอัปโหลดรูป

export interface CreatePhotoDTO {
  title:       string;
  description?: string | null;
  image_url:   string;
  event_name?: string | null;
  uploader_id: number;
}