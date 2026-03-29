// backend/src/models/Photo.ts

export interface Photo {
  id?: number;
  title: string;
  event_id?: number | null;
  event_date?: string;
  description?: string;
  image_url: Buffer | string;
  thumbnail_url?: string | null;
  faculty?: string | null;        // คณะ
  academic_year?: string | null;  // ปีการศึกษา เช่น "2567"
  file_hash?: string | null;      // ✅ MD5 hash ป้องกันรูปซ้ำใน event เดียวกัน
  user_id: number;
  created_by?: number;
  updated_by?: number;
  deleted_at?: Date | string | null;
  deleted_by?: number | null;
}