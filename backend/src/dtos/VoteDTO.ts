//? DTO: Vote
//@ รูปแบบข้อมูลที่รับจาก Frontend ตอน User กดโหวต

export interface VoteDTO {
  activity_id: number; // กิจกรรมที่ต้องการโหวต
  photo_id:    number; // id ของ activity_photos ที่เลือกโหวต
}