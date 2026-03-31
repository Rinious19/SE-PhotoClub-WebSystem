import { Request, Response }    from 'express';
import { ActivityService }      from '../services/ActivityService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

const activityService = new ActivityService();

export class ActivityController {
  //@ GET /api/activities — ทุกคนดูได้
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await activityService.getAll(req.query);
      res.status(200).json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  //@ GET /api/activities/:id — เพิ่มฟังก์ชันนี้ที่หายไปครับ
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID ไม่ถูกต้อง' });
        return;
      }
      const data = await activityService.getById(id);
      res.status(200).json({ success: true, data });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'โหลดกิจกรรมไม่สำเร็จ';
      res.status(msg === 'ไม่พบกิจกรรมนี้' ? 404 : 500)
        .json({ success: false, message: msg });
    }
  }

  //@ POST /api/activities — CLUB_PRESIDENT เท่านั้น
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
        return;
      }
      const activityId = await activityService.create(req.body, userId);
      res.status(201).json({ success: true, data: { id: activityId } });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  //@ PUT /api/activities/:id
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      
      // 🚨 ใส่บรรทัดนี้ลงไปเพื่อ TEST
      console.log("==========================================");
      console.log("🚀 [HOT TEST] มีการยิง API UPDATE เข้ามาแล้ว!");
      console.log("📦 ข้อมูลรูปที่ส่งมา:", req.body.excluded_photo_ids);
      console.log("==========================================");

      await activityService.update(id, req.body);
      res.status(200).json({ success: true, message: 'อัปเดตกิจกรรมสำเร็จ' });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  //@ DELETE /api/activities/:activityId/photos/:photoId
  static async removePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const activityId = parseInt(req.params.activityId as string);
      const activityPhotoId = parseInt(req.params.photoId as string);
      await activityService.removePhoto(activityId, activityPhotoId);
      res.status(200).json({ success: true, message: 'ลบรูปสำเร็จ' });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}