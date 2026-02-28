//? Controller: Photo
//@ จัดการ Request/Response สำหรับฟีเจอร์รูปภาพ

import { Request, Response } from 'express';
import { PhotoRepository } from '../repositories/PhotoRepository';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
//* context (สร้าง instance ของ Repository)
const photoRepo = new PhotoRepository();

export class PhotoController {
  // รับ Request อัปโหลดรูปภาพ
  static async uploadPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        // ✅ 1. เช็คก่อนว่า req.user มีข้อมูลไหม (ป้องกันบัค undefined)
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized: ไม่พบข้อมูล User จาก Token' });
        return;
      }
      //! สิ่งที่สำคัญมาก (ดึง userId จาก res.locals ที่ AuthMiddleware ฝังไว้ให้)
      const userId = req.user.userId || req.user.id;
      const { title, description, image_url } = req.body;
      
      const newPhoto = await photoRepo.create({ 
        title, 
        description, 
        image_url, 
        user_id: userId 
      });
      
      res.status(201).json({
        success: true,
        message: 'อัปโหลดรูปภาพสำเร็จ',
        data: newPhoto
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
  }

  // รับ Request ลบรูปภาพ (Admin / President)
  static async deletePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // ดึง id จาก URL (เช่น /api/photos/delete/5 -> ได้เลข 5)
      const photoId = parseInt(req.params.id as string, 10);
      
      if (isNaN(photoId)) {
        res.status(400).json({ success: false, message: 'ID รูปภาพไม่ถูกต้อง' });
        return;
      }

      const isDeleted = await photoRepo.delete(photoId);
      
      if (isDeleted) {
        res.status(200).json({ success: true, message: 'ลบรูปภาพสำเร็จ' });
      } else {
        res.status(404).json({ success: false, message: 'ไม่พบรูปภาพที่ต้องการลบ' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
    }
  }

  // รับ Request ดึงรูปภาพทั้งหมด
  static async getPhotos(req: Request, res: Response): Promise<void> {
    try {
      const photos = await photoRepo.findAll();
      res.status(200).json({
        success: true,
        data: photos
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Fetch failed', error: error.message });
    }
  }
  // backend/src/controllers/PhotoController.ts

  static async updatePhoto(req: Request, res: Response): Promise<void> {
    try {
      // ✅ เพิ่ม "as string" เพื่อยืนยันว่าเป็นข้อความ และใส่เลข 10 (Radix) เพื่อความปลอดภัย
      const id = parseInt(req.params.id as string, 10); 
    
      const { title, description, image_url } = req.body;

      // ✅ เพิ่มการเช็ค isNaN เหมือนใน deletePhoto เพื่อป้องกัน Error
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID รูปภาพไม่ถูกต้อง' });
        return;
    }
    const success = await photoRepo.update(id, { title, description, image_url });
    
    if (success) {
      res.status(200).json({ success: true, message: 'แก้ไขรูปภาพสำเร็จ' });
    } else {
      res.status(404).json({ success: false, message: 'ไม่พบรูปภาพ' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
}
}