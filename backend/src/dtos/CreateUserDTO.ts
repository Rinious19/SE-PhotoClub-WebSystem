//? DTO: Create User Data Transfer Object
//@ รูปแบบข้อมูลที่ Client (Frontend) จะส่งมาตอนสมัครสมาชิก (Register)

//* context (แยก DTO ออกมาจาก Model เพื่อความปลอดภัย เราจะไม่รับฟิลด์แปลกๆ จาก Frontend)
export interface CreateUserDTO {
  username: string;
  password: string;         // รับเป็น plain text ก่อนนำไปเข้ารหัส
  
  //! สิ่งที่สำคัญมาก (Role ควรกำหนดเป็น EXTERNAL_USER เป็นค่าเริ่มต้นใน Service ไม่ควรให้ Frontend ส่งมาเองเพื่อความปลอดภัย)
}