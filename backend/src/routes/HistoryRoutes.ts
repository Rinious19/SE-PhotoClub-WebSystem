import { Router, Request, Response } from 'express';
import { HistoryService } from '../services/HistoryService';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();
const service = new HistoryService();

router.get('/', AuthMiddleware, async (req: Request, res: Response) => {
  const logs = await service.getAll();
  res.json(logs);
});

export default router;