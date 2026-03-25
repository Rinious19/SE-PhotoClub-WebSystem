//? Controller: Vote
//@ รับ Request โหวตจาก Frontend ส่งให้ VoteService

import { Response }             from 'express';
import { VoteService }          from '../services/VoteService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { sendError }            from '../utils/errorHandler';

const voteService = new VoteService();

export class VoteController {

  //@ POST /api/votes — บันทึกการโหวต (EXTERNAL_USER ขึ้นไป)
  static async castVote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนโหวต' });
        return;
      }

      const { activity_id, photo_id } = req.body;
      if (!activity_id || !photo_id) {
        res.status(400).json({ success: false, message: 'ข้อมูลการโหวตไม่ครบถ้วน' });
        return;
      }

      await voteService.castVote({ activity_id, photo_id }, userId);
      res.status(201).json({ success: true, message: 'โหวตสำเร็จ!' });
    } catch (error: any) {
      //@ ส่ง 409 เมื่อโหวตซ้ำ เพื่อให้ Frontend แสดงข้อความที่เหมาะสม
      if (error.message.includes('โหวตในกิจกรรมนี้ไปแล้ว')) {
        res.status(409).json({ success: false, message: error.message });
      } else if (error.message.includes('สิ้นสุดแล้ว') || error.message.includes('ยังไม่เปิด')) {
        res.status(403).json({ success: false, message: error.message });
      } else {
        sendError(res, error, 'โหวตไม่สำเร็จ');
      }
    }
  }

  //@ GET /api/votes/results/:activityId — ดึงผลโหวต (ทุกคนดูได้)
  static async getResults(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const activityId = parseInt(req.params.activityId as string);
      if (isNaN(activityId)) {
        res.status(400).json({ success: false, message: 'ID กิจกรรมไม่ถูกต้อง' });
        return;
      }
      const results = await voteService.getResults(activityId);
      res.status(200).json({ success: true, data: results });
    } catch (error: any) {
      sendError(res, error, 'โหลดผลโหวตไม่สำเร็จ');
    }
  }

  //@ GET /api/votes/my-votes?activityIds=1,2,3 — ดึงโหวตของ user ปัจจุบัน
  static async getMyVotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      // รับ activityIds เป็น comma-separated string แล้วแปลงเป็น array ตัวเลข
      const idsParam  = (req.query.activityIds as string) || '';
      const activityIds = idsParam
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);

      const votes = await voteService.getUserVotesForActivities(userId, activityIds);
      res.status(200).json({ success: true, data: votes });
    } catch (error: any) {
      sendError(res, error, 'โหลดข้อมูลโหวตไม่สำเร็จ');
    }
  }
}