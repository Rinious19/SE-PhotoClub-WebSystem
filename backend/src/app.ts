//? Main: Server Entry Point
//@ ไฟล์หลักสำหรับรัน Server Express

import express from 'express';
import path from 'path';
import cors from 'cors';
import authRoutes from './routes/AuthRoutes';
import photoRoutes from './routes/PhotoRoutes';
import eventRoutes from './routes/EventRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

//* context (Middleware พื้นฐาน)
app.use(cors());

// ✅ เพิ่ม limit เป็น 50MB เพื่อรองรับรูปภาพขนาดใหญ่
//    (multipart/form-data ผ่าน multer แต่ต้องตั้ง limit ที่ express ด้วย)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/photos', photoRoutes);

// อนุญาตให้ดึงไฟล์จากโฟลเดอร์ uploads ได้
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