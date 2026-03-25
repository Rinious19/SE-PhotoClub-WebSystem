//? Model: HistoryLog
//@ โครงสร้างข้อมูล History Log ที่ตรงกับ Table history_logs ใน Database

//* context (แยก TargetType และ Action เป็น union type เพื่อป้องกันพิมพ์ผิด)
export type HistoryAction =
  | 'CHANGE_ROLE'
  | 'CREATE_USER'
  | 'DELETE_USER'
  | 'UPLOAD_PHOTO'
  | 'UPDATE_PHOTO'
  | 'DELETE_PHOTO'
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'SYSTEM';

export type HistoryTargetType = 'USER' | 'PHOTO' | 'ACTIVITY' | 'SYSTEM';

export interface HistoryLog {
  id?:          number;
  actor_id?:    number | null;    // ผู้กระทำ
  action:       HistoryAction;
  target_type:  HistoryTargetType;
  target_id?:   number | null;    // id ของสิ่งที่ถูกกระทำ
  detail?:      string | null;    // JSON string รายละเอียดเพิ่มเติม
  created_at?:  Date | string;
}