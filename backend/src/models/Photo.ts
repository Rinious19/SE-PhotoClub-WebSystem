export interface Photo {
  id?: number;
  title: string;
  event_date?: string;
  description?: string;
  image_url: Buffer | string;
  user_id: number;
  
  // ✅ เพิ่ม 4 บรรทัดนี้เข้าไป เพื่อให้ TypeScript รู้จักฟิลด์ใหม่ที่เราเพิ่งสร้างใน Database
  created_by?: number;        // ? หมายถึง อาจจะไม่มีค่าก็ได้ (เพื่อไม่ให้โค้ดเก่าพัง)
  updated_by?: number; 
  deleted_at?: Date | string | null; 
  deleted_by?: number | null;
}