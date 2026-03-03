//? Main: Server Entry Point
//@ ไฟล์หลักสำหรับรัน Server Express

import path from 'path';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/AuthRoutes';
import photoRoutes from './routes/PhotoRoutes';
import adminRoutes from './routes/AdminRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

//* context (Middleware พื้นฐาน)
app.use(cors()); // อนุญาตให้ Frontend ยิง API มาได้    
app.use(express.json()); // รับข้อมูลแบบ JSON

// อนุญาตให้เข้าถึงโฟลเดอร์ uploads ผ่าน URL ที่ขึ้นต้นด้วย /uploads ได้
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// เชื่อมต่อ Module Auth
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes); // เพิ่มการใช้งาน Photo Route

app.use('/api/admin', adminRoutes);
//! สิ่งที่สำคัญมาก (Route สำหรับเช็คสถานะ Server)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'PhotoClub API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;