import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 1. ดึงค่า Host มาเก็บไว้ในตัวแปรก่อน
const dbHost = process.env.DB_HOST || 'localhost';

// 2. สร้างเงื่อนไขเช็คว่าเป็น Local หรือไม่
// ถ้า Host เป็น 'localhost' หรือ '127.0.0.1' จะได้ค่าเป็น true
const isLocal = (dbHost === 'localhost' || dbHost === '127.0.0.1');

export const pool = mysql.createPool({
  host: dbHost,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'photoclub_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,  
  timezone: '+07:00',  
  
  // 3. ใส่ Switch ตรงนี้: 
  // ถ้า isLocal เป็น true (รันบนเครื่อง) จะให้ ssl เป็น undefined (ไม่ใช้งาน)
  // ถ้า isLocal เป็น false (รันออนไลน์) จะเปิดใช้งาน { rejectUnauthorized: false }
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  
  connectTimeout: 30000,  
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// ส่วนของ connection test
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`📍 Connected to: ${dbHost}:${process.env.DB_PORT || 3306}`);
    console.log(`🔒 SSL Enabled: ${!isLocal}`); // แอบเพิ่ม log ให้ดูสถานะ SSL ด้วย
    console.log(`📦 Database: ${process.env.DB_NAME || 'photoclub_db'}`);
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    console.error('🔍 Connection details:', {
      host: dbHost,
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'photoclub_db',
      user: process.env.DB_USER || 'root',
      hasPassword: !!process.env.DB_PASSWORD,
      sslUsed: !isLocal
    });
  }
};

testConnection();

// เพิ่ม graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️ SIGTERM received, closing database connections...');
  await pool.end();
  process.exit(0);
});