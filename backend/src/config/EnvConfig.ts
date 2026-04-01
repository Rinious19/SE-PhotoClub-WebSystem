// backend/src/config/EnvConfig.ts
import dotenv from 'dotenv';

dotenv.config(); // อย่าลืมโหลด .env สำหรับตอนรัน Local นะครับ

export const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'photoclub_db',
    // บน Render จะอ่านค่า 40657 จากที่เซตไว้ ถ้าไม่มี (เช่นรัน Local) จะใช้ 3306
    port: Number(process.env.DB_PORT) || 3306, 
};