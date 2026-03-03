// PhotoController.ts

import { Request, Response } from "express";
import { PhotoRepository } from "../repositories/PhotoRepository";
import { AuthenticatedRequest } from "../middlewares/AuthMiddleware";

const photoRepo = new PhotoRepository();

export class PhotoController {
  // --- [1. สร้างรูปภาพใหม่ (เก็บเป็น BLOB)] ---
  static async uploadPhoto(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const userId = req.user.userId || req.user.id;
      const { title, event_date, description } = req.body;

      // 🌟 เช็ค req.file.buffer แทน req.file.filename
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ success: false, message: "กรุณาอัปโหลดรูปภาพ" });
        return;
      }

      // 🌟 ดึงข้อมูลไบนารีของรูปภาพ
      const imageBuffer = req.file.buffer;

      const newPhoto = await photoRepo.create({
        title,
        event_date,
        description,
        image_url: imageBuffer, // 🌟 ส่ง Buffer ไปเซฟ (Error จะหายถ้าแก้ Type ใน Repo แล้ว)
        user_id: userId,
        created_by: userId,
      });

      await photoRepo.logAction(
        newPhoto.id,
        "UPLOAD",
        userId,
        `อัปโหลดรูปภาพ: ${title}`,
      );

      res
        .status(201)
        .json({
          success: true,
          message: "อัปโหลดรูปภาพสำเร็จ",
          data: newPhoto,
        });
    } catch (error: any) {
      console.error("Upload Error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Upload failed",
          error: error.message,
        });
    }
  }

  // --- [2. อัปเดตข้อมูล (รองรับการเปลี่ยนรูปใหม่เป็น BLOB)] ---
  static async updatePhoto(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { title, event_date, description } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (isNaN(id) || !userId) {
        res.status(400).json({ success: false, message: "ข้อมูลไม่ถูกต้อง" });
        return;
      }

      let image_data = undefined;
      if (req.file && req.file.buffer) {
        image_data = req.file.buffer; // 🌟 ถ้ามีการส่งรูปใหม่มา ให้ใช้ Buffer ตัวใหม่
      }

      const success = await photoRepo.update(id, {
        title,
        event_date,
        description,
        image_url: image_data, // 🌟 ส่งไปอัปเดตเป็น Buffer
        updated_by: userId,
      });

      if (success) {
        await photoRepo.logAction(
          id,
          "EDIT",
          userId,
          `อัปเดตข้อมูลรูปภาพ: ${title}`,
        );
        res.status(200).json({ success: true, message: "แก้ไขรูปภาพสำเร็จ" });
      } else {
        res.status(404).json({ success: false, message: "ไม่พบรูปภาพ" });
      }
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: `พังเพราะ: ${error.message}` });
    }
  }

  // --- [3. ลบรูปภาพ (Soft Delete)] ---
  static async deletePhoto(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const photoId = parseInt(req.params.id as string, 10);
      const userId = req.user?.userId || req.user?.id;

      if (isNaN(photoId) || !userId) {
        res
          .status(400)
          .json({ success: false, message: "ID ไม่ถูกต้อง หรือไม่พบสิทธิ์" });
        return;
      }

      const isDeleted = await photoRepo.softDelete(photoId, userId);

      if (isDeleted) {
        await photoRepo.logAction(photoId, "DELETE", userId, "ย้ายรูปลงถังขยะ");
        res
          .status(200)
          .json({ success: true, message: "ย้ายรูปภาพลงถังขยะสำเร็จ" });
      } else {
        res
          .status(404)
          .json({ success: false, message: "ไม่พบรูปภาพที่ต้องการลบ" });
      }
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: "Delete failed",
          error: error.message,
        });
    }
  }

  // --- [4. ดึงรูปภาพทั้งหมด (เฉพาะที่ยังไม่ถูกลบ)] ---
  static async getPhotos(req: Request, res: Response): Promise<void> {
    try {
      const photos = await photoRepo.findAllActive();
      res.status(200).json({ success: true, data: photos });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: "Fetch failed",
          error: error.message,
        });
    }
  }
}
