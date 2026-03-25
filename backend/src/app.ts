//? Main: Server Entry Point
//@ ไฟล์หลักสำหรับรัน Server Express

import express from 'express';
import adminRoutes from './routes/AdminRoutes';
import historyRoutes from './routes/HistoryRoutes';
import path from 'path';
import cors from 'cors';
import authRoutes from './routes/AuthRoutes';
import photoRoutes from './routes/PhotoRoutes';
import eventRoutes from './routes/EventRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

//* context (Middleware พื้นฐาน)
app.use(cors()); // อนุญาตให้ Frontend ยิง API มาได้    
app.use(express.json()); // รับข้อมูลแบบ JSON
app.use('/admin', adminRoutes);
app.use('/history', historyRoutes);
app.use('/api/admin', adminRoutes);

// เชื่อมต่อ Module Auth
app.use('/api/auth', authRoutes);

//! สิ่งที่สำคัญมาก (Route สำหรับเช็คสถานะ Server)

app.use(cors());

// ✅ เพิ่ม limit เป็น 50MB เพื่อรองรับรูปภาพขนาดใหญ่
//    (multipart/form-data ผ่าน multer แต่ต้องตั้ง limit ที่ express ด้วย)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/photos', photoRoutes);

// ✅ Serve static files: รูปเต็ม + thumbnail
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/events', eventRoutes);

app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'PhotoClub API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;
