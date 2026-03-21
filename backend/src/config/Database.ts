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
<<<<<<< HEAD
  queueLimit: 0
=======
  queueLimit: 0,
  // ✅ แก้ Timezone Bug
  dateStrings: true,
  timezone: 'local',
>>>>>>> fe687ab4973be30cfd7184d885fc117760ffb180
});