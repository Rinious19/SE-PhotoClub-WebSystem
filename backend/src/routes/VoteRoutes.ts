//? Routes: Vote
//@ กำหนด Endpoint สำหรับการโหวต
//  โหวตได้เฉพาะ EXTERNAL_USER, ADMIN, CLUB_PRESIDENT (ไม่ใช่ GUEST)

import { Router, RequestHandler } from 'express';
import { VoteController }        from '../controllers/VoteController';
import { AuthMiddleware }        from '../middlewares/AuthMiddleware';
import { RoleMiddleware }        from '../middlewares/RoleMiddleware';

const router = Router();

// โหวต (ต้อง login และเป็น EXTERNAL_USER ขึ้นไป)
router.post(
  '/',
  AuthMiddleware as RequestHandler,
  RoleMiddleware(['EXTERNAL_USER', 'ADMIN', 'CLUB_PRESIDENT']) as RequestHandler,
  VoteController.castVote as RequestHandler
);

// ดึงผลโหวต (ทุกคนดูได้)
router.get('/results/:activityId', VoteController.getResults as RequestHandler);

// ดึงโหวตของ user ปัจจุบัน (ต้อง login)
router.get(
  '/my-votes',
  AuthMiddleware as RequestHandler,
  VoteController.getMyVotes as RequestHandler
);

export default router;