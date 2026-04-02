//? Controller: ActivityController
//@ backend/src/controllers/ActivityController.ts

import { Request, Response }    from 'express';
import { ActivityService }      from '../services/ActivityService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

const activityService = new ActivityService();

/**
 * ✅ ฟังก์ชันสำหรับ "ขาเข้า": แปลงวันที่จาก Frontend (ISO) ให้เป็น Format ที่ MySQL ยอมรับ (YYYY-MM-DD HH:mm:ss)
 * โดยปรับให้เป็นเวลาไทย (UTC+7) ก่อนบันทึกลง Database
 */
const formatDateForDB = (dateStr: any) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    return dateStr.slice(0, 19).replace('T', ' ');
  }

  // ปรับเป็นเวลาไทย (UTC + 7)
  const bangkokTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = bangkokTime.getUTCFullYear();
  const mm = pad(bangkokTime.getUTCMonth() + 1);
  const dd = pad(bangkokTime.getUTCDate());
  const hh = pad(bangkokTime.getUTCHours());
  const min = pad(bangkokTime.getUTCMinutes());
  const ss = pad(bangkokTime.getUTCSeconds());
  
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

/**
 * ✅ ฟังก์ชันสำหรับ "ขาออก": แปลงวันที่จาก Database ให้เป็น ISO String
 * เพื่อให้ Frontend ทราบว่าเป็นเวลาสากล (UTC) และนำไปบวก Timezone (+7) ได้ถูกต้อง
 */
const formatActivityDates = (activity: any) => {
  if (!activity) return activity;
  return {
    ...activity,
    // แปลง Date Object หรือ String จาก DB ให้เป็น ISO 8601 (มีตัว Z ต่อท้าย)
    start_at: activity.start_at ? new Date(activity.start_at).toISOString() : null,
    end_at: activity.end_at ? new Date(activity.end_at).toISOString() : null,
    created_at: activity.created_at ? new Date(activity.created_at).toISOString() : null,
  };
};

export class ActivityController {
  //@ GET /api/activities — ดึงรายการทั้งหมด
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const rawData = await activityService.getAll(req.query);
      
      // ✅ แปลงวันที่ทุกรายการก่อนส่งออก
      const data = Array.isArray(rawData) 
        ? rawData.map(item => formatActivityDates(item))
        : rawData;

      res.status(200).json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  //@ GET /api/activities/:id — ดึงข้อมูลรายกิจกรรม
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID ไม่ถูกต้อง' });
        return;
      }
      
      const rawData = await activityService.getById(id);
      
      // ✅ แปลงวันที่สำหรับข้อมูลชิ้นเดียว
      const data = rawData ? formatActivityDates(rawData) : null;

      if (!data) {
        res.status(404).json({ success: false, message: 'ไม่พบกิจกรรมนี้' });
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'โหลดกิจกรรมไม่สำเร็จ';
      res.status(500).json({ success: false, message: msg });
    }
  }

  //@ POST /api/activities — สร้างกิจกรรมใหม่
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
        return;
      }

      // ✅ จัดการแปลงวันที่ขาเข้า
      const body = { ...req.body };
      if (body.start_at) body.start_at = formatDateForDB(body.start_at);
      if (body.end_at) body.end_at = formatDateForDB(body.end_at);

      const activityId = await activityService.create(body, userId);
      res.status(201).json({ success: true, data: { id: activityId } });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  //@ PUT /api/activities/:id — แก้ไขกิจกรรม
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      
      // ✅ จัดการแปลงวันที่ขาเข้า
      const body = { ...req.body };
      if (body.start_at) body.start_at = formatDateForDB(body.start_at);
      if (body.end_at) body.end_at = formatDateForDB(body.end_at);
      
      // Log สำหรับตรวจสอบการ Update
      console.log(`[UPDATE] Activity ID: ${id} at ${new Date().toISOString()}`);

      await activityService.update(id, body);
      res.status(200).json({ success: true, message: 'อัปเดตกิจกรรมสำเร็จ' });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  //@ DELETE /api/activities/:activityId/photos/:photoId — ลบรูปออกจากกิจกรรม
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

  //@ DELETE /api/admin/users/:id — ลบผู้ใช้งานถาวร (Hard Delete)
  static async deletePermanent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      
      // เรียกใช้ฟังก์ชันผ่าน Service (ตรวจสอบว่าใน ActivityService มีเมธอดนี้แล้ว)
      const success = await (activityService as any).hardDeleteUser(id); 
      
      if (success) {
        res.status(200).json({ success: true, message: 'ลบข้อมูลออกจากระบบถาวรแล้ว' });
      } else {
        res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}