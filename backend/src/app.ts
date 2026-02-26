//? Main: Server Entry Point
//@ ไฟล์หลักสำหรับรัน Server Express

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/AuthRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

//* context (Middleware พื้นฐาน)
app.use(cors()); // อนุญาตให้ Frontend ยิง API มาได้
app.use(express.json()); // รับข้อมูลแบบ JSON

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