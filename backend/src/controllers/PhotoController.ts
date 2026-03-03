//? Controller: Photo
//@ จัดการ Request/Response สำหรับฟีเจอร์รูปภาพ พร้อมรองรับระบบอัปโหลดและเก็บประวัติ

import { Request, Response } from "express";
import { PhotoRepository } from "../repositories/PhotoRepository";
import { AuthenticatedRequest } from "../middlewares/AuthMiddleware";

//* context (สร้าง instance ของ Repository)
const photoRepo = new PhotoRepository();

export class PhotoController {
  // --- [1. สร้างรูปภาพใหม่ (อัปโหลดไฟล์จริง)] ---
  static async uploadPhoto(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // 1. เช็คก่อนว่ามีสิทธิ์ไหม
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized: ไม่พบข้อมูล User จาก Token" });
        return;
      }
      
      const userId = req.user.userId || req.user.id;
      const { title, description } = req.body;

      // 2. เช็คว่ามีไฟล์รูปแนบมาด้วยไหม (ถูกจับโดย Multer)
      if (!req.file) {
        res.status(400).json({ success: false, message: "กรุณาอัปโหลดรูปภาพ" });
        return;
      }

      // 3. สร้าง URL ของรูปภาพจากไฟล์ที่อัปโหลด (ไม่ใช่รับจาก Text แล้ว)
      const image_url = `/uploads/${req.file.filename}`;

      // 4. บันทึกลงตาราง photos (เพิ่ม created_by เข้าไป)
      const newPhoto = await photoRepo.create({
        title,
        description,
        image_url,
        user_id: userId,
        created_by: userId // เพื่อให้รู้ว่าใครเป็นคนอัปโหลดภาพนี้
      });

      // 5. บันทึกประวัติลงตาราง photo_audit_logs
      // (ฟังก์ชัน logAction นี้เราจะไปเขียนเพิ่มใน PhotoRepository กันทีหลัง)
      await photoRepo.logAction(newPhoto.id, 'UPLOAD', userId, `อัปโหลดรูปภาพ: ${title}`);

      res.status(201).json({ success: true, message: "อัปโหลดรูปภาพสำเร็จ", data: newPhoto });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Upload failed", error: error.message });
    }
  }

  // --- [2. อัปเดตข้อมูล (รองรับกรณีเปลี่ยนรูปใหม่ด้วย)] ---
  static async updatePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { title, description } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (isNaN(id) || !userId) {
        res.status(400).json({ success: false, message: "ข้อมูลไม่ถูกต้อง หรือไม่พบสิทธิ์" });
        return;
      }

      // ตรวจสอบว่าผู้ใช้ส่งไฟล์รูปใหม่มาด้วยหรือไม่
      let image_url = undefined;
      let actionDetails = `อัปเดตข้อมูลรูปภาพ: ${title}`;
      if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
        actionDetails += ' (มีการเปลี่ยนรูปภาพใหม่)';
      }

      // อัปเดตตาราง photos (เพิ่ม updated_by)
      const success = await photoRepo.update(id, {
        title,
        description,
        image_url, // ถ้าไม่มีรูปใหม่ค่านี้จะเป็น undefined (Repo ต้องจัดการไม่ให้อัปเดตทับถ้าไม่มีค่า)
        updated_by: userId
      });

      if (success) {
        // บันทึกประวัติการแก้ไขลง audit_logs
        await photoRepo.logAction(id, 'EDIT', userId, actionDetails);
        res.status(200).json({ success: true, message: "แก้ไขรูปภาพสำเร็จ" });
      } else {
        res.status(404).json({ success: false, message: "ไม่พบรูปภาพ" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Update failed", error: error.message });
    }
  }

  // --- [3. ลบรูปภาพ (เตรียมเปลี่ยนเป็น Soft Delete)] ---
  static async deletePhoto(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const photoId = parseInt(req.params.id as string, 10);
      const userId = req.user?.userId || req.user?.id;

      if (isNaN(photoId) || !userId) {
        res.status(400).json({ success: false, message: "ID รูปภาพไม่ถูกต้อง หรือไม่พบสิทธิ์" });
        return;
      }

      // เรียกฟังก์ชันลบ (เราจะไปแก้ให้เป็น Soft Delete ใน PhotoRepository)
      const isDeleted = await photoRepo.softDelete(photoId, userId);

      if (isDeleted) {
        // บันทึกประวัติการลบลง audit_logs
        await photoRepo.logAction(photoId, 'DELETE', userId, 'ย้ายรูปลงถังขยะ');
        res.status(200).json({ success: true, message: "ย้ายรูปภาพลงถังขยะสำเร็จ" });
      } else {
        res.status(404).json({ success: false, message: "ไม่พบรูปภาพที่ต้องการลบ" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Delete failed", error: error.message });
    }
  }

  // --- [4. ดึงรูปภาพทั้งหมด (เฉพาะที่ยังไม่ถูกลบ)] ---
  static async getPhotos(req: Request, res: Response): Promise<void> {
    try {
      // (เราจะไปแก้ findAll ใน Repo ให้แสดงเฉพาะรูปที่ deleted_at IS NULL)
      const photos = await photoRepo.findAllActive(); 
      res.status(200).json({ success: true, data: photos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Fetch failed", error: error.message });
    }
  }
}