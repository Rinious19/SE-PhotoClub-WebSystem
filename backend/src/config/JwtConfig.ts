//? Config: JWT Settings
//@ จัดการค่า Configuration สำหรับ JSON Web Token

import dotenv from 'dotenv';

//* context (โหลดค่าจากไฟล์ .env)
dotenv.config();

//! สิ่งที่สำคัญมาก (ต้องมี JWT_SECRET ในไฟล์ .env เสมอเพื่อความปลอดภัย)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_photoclub_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// export ค่าออกไปให้ไฟล์อื่นใช้งาน
export const jwtConfig = {
  secret: JWT_SECRET || "default_secret_key",
  expiresIn: JWT_EXPIRES_IN,
};