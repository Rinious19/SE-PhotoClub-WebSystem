//? Config: Database Connection
//@ สร้าง Connection Pool สำหรับเชื่อมต่อ MySQL

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'photoclub_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // ✅ แก้ Timezone Bug (สำคัญมาก):
  // dateStrings: true → บอก mysql2 ให้คืนค่า DATE/DATETIME เป็น string "YYYY-MM-DD"
  //               แทนที่จะแปลงเป็น JavaScript Date object ซึ่งทำให้ timezone เพี้ยน
  // timezone: 'local' → ให้ driver ใช้ local timezone ของ server (UTC+7) แทน UTC
  dateStrings: true,
  timezone: 'local',
});