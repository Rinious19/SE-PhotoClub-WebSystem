//? Config: Database Connection
//@ สร้าง Connection Pool สำหรับเชื่อมต่อ MySQL

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway', // ในรูป Railway ชื่อ database คือ railway ครับ
  //@ [เพิ่มส่วนนี้] ดึง Port จาก Environment (Railway Public Port: 40657)
  port: Number(process.env.DB_PORT) || 3306, 
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  timezone: 'local',

  //@ [สำคัญมาก] เพิ่ม SSL เพื่อให้เชื่อมต่อกับ Railway จากภายนอกได้
  ssl: {
    rejectUnauthorized: false
  }
});

// เพิ่มส่วนนี้เพื่อช่วย Debug ในหน้า Logs ของ Render
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });