// backend/src/controllers/PhotoController.ts

import { Request, Response } from "express";
import { PhotoRepository } from "../repositories/PhotoRepository";
import { AuthenticatedRequest } from "../middlewares/AuthMiddleware";

const photoRepo = new PhotoRepository();
const FOLDER_PAGE_SIZE = 12; // folders per page
const PHOTO_PAGE_SIZE  = 20; // photos per page

export class PhotoController {
  // --- [1. อัปโหลดรูป] ---
  static async uploadPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, event_date, description } = req.body;
      const userId = req.user?.userId || req.user?.id;
      if (!req.file?.buffer || !title || !userId) {
        res.status(400).json({ success: false, message: "ข้อมูลไม่ครบ" });
        return;
      }
      const photo = await photoRepo.create({
        title, event_date, description,
        image_url: req.file.buffer,
        user_id: userId, created_by: userId,
      });
      await photoRepo.logAction(photo.id, "UPLOAD", userId, `อัปโหลดรูป: ${title}`);
      res.status(201).json({ success: true, data: photo });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- [2. แก้ไขรูป] ---
  static async updatePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { title, event_date, description } = req.body;
      const userId = req.user?.userId || req.user?.id;
      if (isNaN(id) || !userId) {
        res.status(400).json({ success: false, message: "ข้อมูลไม่ถูกต้อง" });
        return;
      }
      let image_data = undefined;
      if (req.file?.buffer) image_data = req.file.buffer;
      const success = await photoRepo.update(id, { title, event_date, description, image_url: image_data, updated_by: userId });
      if (success) {
        await photoRepo.logAction(id, "EDIT", userId, `อัปเดตรูป: ${title}`);
        res.status(200).json({ success: true, message: "แก้ไขรูปภาพสำเร็จ" });
      } else {
        res.status(404).json({ success: false, message: "ไม่พบรูปภาพ" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- [3. ลบรูป (Soft Delete)] ---
  static async deletePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const photoId = parseInt(req.params.id as string, 10);
      const userId = req.user?.userId || req.user?.id;
      if (isNaN(photoId) || !userId) {
        res.status(400).json({ success: false, message: "ID ไม่ถูกต้อง" });
        return;
      }
      const isDeleted = await photoRepo.softDelete(photoId, userId);
      if (isDeleted) {
        await photoRepo.logAction(photoId, "DELETE", userId, "ย้ายรูปลงถังขยะ");
        res.status(200).json({ success: true, message: "ลบรูปภาพสำเร็จ" });
      } else {
        res.status(404).json({ success: false, message: "ไม่พบรูปภาพ" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- [4. ดึงรูปทั้งหมด (legacy)] ---
  static async getPhotos(req: Request, res: Response): Promise<void> {
    try {
      const photos = await photoRepo.findAllActive();
      res.status(200).json({ success: true, data: photos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ --- [5. ดึง Folders (Grouped by Event) + Lazy Load] ---
  // GET /api/photos/grouped?page=1
  static async getGroupedByEvent(req: Request, res: Response): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page as string) || 1);
      const offset = (page - 1) * FOLDER_PAGE_SIZE;
      const [groups, total] = await Promise.all([
        photoRepo.findGroupedByEvent(FOLDER_PAGE_SIZE, offset),
        photoRepo.countGroups(),
      ]);
      res.status(200).json({
        success: true,
        data: groups,
        pagination: {
          page,
          pageSize: FOLDER_PAGE_SIZE,
          total,
          totalPages: Math.ceil(total / FOLDER_PAGE_SIZE),
          hasMore: offset + groups.length < total,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ --- [6. ดึงรูปใน Event แบบ Pagination (Lazy Load)] ---
  // GET /api/photos/by-event/:eventName?page=1
  static async getPhotosByEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventName = decodeURIComponent(req.params.eventName as string);
      const page   = Math.max(1, parseInt(req.query.page as string) || 1);
      const offset = (page - 1) * PHOTO_PAGE_SIZE;
      const [photos, total] = await Promise.all([
        photoRepo.findByEventPaginated(eventName, PHOTO_PAGE_SIZE, offset),
        photoRepo.countByEvent(eventName),
      ]);
      res.status(200).json({
        success: true,
        data: photos,
        pagination: {
          page,
          pageSize: PHOTO_PAGE_SIZE,
          total,
          totalPages: Math.ceil(total / PHOTO_PAGE_SIZE),
          hasMore: offset + photos.length < total,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}