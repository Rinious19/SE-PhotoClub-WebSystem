//? Controller: ActivityController
//@ รับ Request → ActivityService → Response
//  วางไฟล์นี้ที่: backend/src/controllers/ActivityController.ts

import { Request, Response }    from 'express';
import { ActivityService }      from '../services/ActivityService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { ActivityStatus }       from '../enums/ActivityStatus';
import { sendError }            from '../utils/errorHandler';

const activityService = new ActivityService();

export class ActivityController {

  //@ GET /api/activities — ทุกคนดูได้ รวม Guest
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { keyword, category, status, dateFrom, dateTo } =
        req.query as Record<string, string | undefined>;

      const validStatus = (Object.values(ActivityStatus) as string[]).includes(status ?? '')
        ? (status as ActivityStatus)
        : undefined;

      const data = await activityService.getAll({
        keyword,
        category,
        status:   validStatus,
        dateFrom,
        dateTo,
      });
      res.status(200).json({ success: true, data });
    } catch (e) {
      sendError(res, e, 'โหลดกิจกรรมไม่สำเร็จ');
    }
  }

  //@ GET /api/activities/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID ไม่ถูกต้อง' });
        return;
      }
      const data = await activityService.getById(id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'โหลดกิจกรรมไม่สำเร็จ';
      res.status(msg === 'ไม่พบกิจกรรมนี้' ? 404 : 500)
        .json({ success: false, message: msg });
    }
  }

  //@ POST /api/activities — CLUB_PRESIDENT เท่านั้น
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId ?? req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
        return;
      }
      const activityId = await activityService.create(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'สร้างกิจกรรมสำเร็จ',
        data:    { id: activityId },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'สร้างกิจกรรมไม่สำเร็จ';
      res.status(400).json({ success: false, message: msg });
    }
  }

  //@ PUT /api/activities/:id — ADMIN / CLUB_PRESIDENT
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID ไม่ถูกต้อง' });
        return;
      }
      await activityService.update(id, req.body);
      res.status(200).json({ success: true, message: 'อัปเดตกิจกรรมสำเร็จ' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'อัปเดตกิจกรรมไม่สำเร็จ';
      res.status(400).json({ success: false, message: msg });
    }
  }

  //@ DELETE /api/activities/:activityId/photos/:photoId
  static async removePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const activityId      = parseInt(req.params.activityId as string);
      const activityPhotoId = parseInt(req.params.photoId as string);
      if (isNaN(activityId) || isNaN(activityPhotoId)) {
        res.status(400).json({ success: false, message: 'ID ไม่ถูกต้อง' });
        return;
      }
      await activityService.removePhoto(activityId, activityPhotoId);
      res.status(200).json({ success: true, message: 'ลบรูปออกจากกิจกรรมสำเร็จ' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ลบรูปไม่สำเร็จ';
      res.status(400).json({ success: false, message: msg });
    }
  }
}