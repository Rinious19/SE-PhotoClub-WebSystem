//? Main: Server Entry Point
//@ ไฟล์หลักสำหรับรัน Server Express

import express from 'express';
import path from 'path'; // นำเข้า module path
import cors from 'cors';
import authRoutes from './routes/AuthRoutes';
import photoRoutes from './routes/PhotoRoutes'; //นำเข้า PhotoRoutes
import eventRoutes from './routes/EventRoutes';
const app = express();
const PORT = process.env.PORT || 5000;

//* context (Middleware พื้นฐาน)
app.use(cors()); // อนุญาตให้ Frontend ยิง API มาได้  
  
// แก้ไข 2 บรรทัดนี้เพื่อรองรับไฟล์ขนาดใหญ่ (เช่น 10MB)
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/photos', photoRoutes);//เปิดใช้งาน Route /api/photos

// อนุญาตให้ดึงไฟล์จากโฟลเดอร์ uploads ได้
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/events', eventRoutes);

// เชื่อมต่อ Module Auth
app.use('/api/auth', authRoutes);

//! สิ่งที่สำคัญมาก (Route สำหรับเช็คสถานะ Server)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'PhotoClub API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;