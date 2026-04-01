import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,  // ปรับจาก true
  timezone: '+07:00',  // ใช้ timezone ชัดเจน
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 30000,  // เพิ่มเป็น 30 วินาที
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// ปรับปรุง connection test
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`📍 Connected to: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`📦 Database: ${process.env.DB_NAME}`);
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    console.error('🔍 Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      hasPassword: !!process.env.DB_PASSWORD
    });
    // ไม่ throw error เพื่อให้ server ยังรันได้ (แต่จะใช้ DB ไม่ได้)
  }
};

testConnection();

// เพิ่ม graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️ SIGTERM received, closing database connections...');
  await pool.end();
  process.exit(0);
});