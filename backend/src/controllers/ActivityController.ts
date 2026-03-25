//? Controller: Activity
//@ รับ Request จาก Frontend ส่งให้ ActivityService แล้วตอบ Response กลับ

import { Request, Response }       from 'express';
import { ActivityService }         from '../services/ActivityService';
import { AuthenticatedRequest }    from '../middlewares/AuthMiddleware';
import { ActivityStatus }          from '../enums/ActivityStatus';
import { sendError }               from '../utils/errorHandler';

const activityService = new ActivityService();

export class ActivityController {

  //@ GET /api/activities — ดึงกิจกรรมทั้งหมด (ทุกคนดูได้ รวม Guest)
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { keyword, category, status, dateFrom, dateTo } = req.query;

      // ตรวจสอบว่า status ที่ส่งมาถูกต้องตาม enum
      const validStatus = Object.values(ActivityStatus).includes(status as ActivityStatus)
        ? (status as ActivityStatus)
        : undefined;

      const activities = await activityService.getAll({
        keyword:  keyword  as string | undefined,
        category: category as string | undefined,
        status:   validStatus,
        dateFrom: dateFrom as string | undefined,
        dateTo:   dateTo   as string | undefined,
      });

      res.status(200).json({ success: true, data: activities });
    } catch (error: any) {
      sendError(res, error, 'โหลดกิจกรรมไม่สำเร็จ');
    }
  }

  //@ GET /api/activities/:id — ดึงกิจกรรมเดี่ยว พร้อมรูปและผลโหวต
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID กิจกรรมไม่ถูกต้อง' });
        return;
      }
      const activity = await activityService.getById(id);
      res.status(200).json({ success: true, data: activity });
    } catch (error: any) {
      if (error.message === 'ไม่พบกิจกรรมนี้') {
        res.status(404).json({ success: false, message: error.message });
      } else {
        sendError(res, error, 'โหลดกิจกรรมไม่สำเร็จ');
      }
    }
  }

  //@ POST /api/activities — สร้างกิจกรรมใหม่ (CLUB_PRESIDENT เท่านั้น)
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
        return;
      }
      const activityId = await activityService.create(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'สร้างกิจกรรมสำเร็จ',
        data: { id: activityId },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  //@ PUT /api/activities/:id — อัปเดตกิจกรรม (ADMIN / CLUB_PRESIDENT)
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID กิจกรรมไม่ถูกต้อง' });
        return;
      }
      await activityService.update(id, req.body);
      res.status(200).json({ success: true, message: 'อัปเดตกิจกรรมสำเร็จ' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  //@ DELETE /api/activities/:activityId/photos/:photoId — ลบรูปออกจากกิจกรรม
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
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}