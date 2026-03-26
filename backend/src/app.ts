//? Main: app.ts — backend entry point (แก้ไขเพิ่ม activity + vote routes)
//@ วางไฟล์นี้ที่: backend/src/app.ts
//  เพิ่ม 2 บรรทัด import + 2 บรรทัด use จากเดิม

import express      from 'express';
import path         from 'path';
import cors         from 'cors';
import authRoutes   from './routes/AuthRoutes';
import photoRoutes  from './routes/PhotoRoutes';
import eventRoutes  from './routes/EventRoutes';
//@ เพิ่ม: activity + vote routes
import activityRoutes from './routes/ActivityRoutes';
import voteRoutes     from './routes/VoteRoutes';

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/photos',     photoRoutes);
app.use('/uploads',        express.static(path.join(__dirname, '../uploads')));
app.use('/api/events',     eventRoutes);
app.use('/api/auth',       authRoutes);
//@ เพิ่ม routes ใหม่
app.use('/api/activities', activityRoutes);
app.use('/api/votes',      voteRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'PhotoClub API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;