import { Request, Response } from "express";
import { PhotoRepository } from "../repositories/PhotoRepository";
import { historyService } from "../services/HistoryService";
import { AuthenticatedRequest } from "../middlewares/AuthMiddleware";
import { sendError } from "../utils/errorHandler";
import {
  createThumbnail,
  deletePhotoFiles,
  PHOTOS_URL_PREFIX,
} from "../middlewares/UploadMiddleware";
import fs from "fs";
import crypto from "crypto";
import { pool } from "../config/Database";

const photoRepo = new PhotoRepository();
const FOLDER_PAGE_SIZE = 12;
const PHOTO_PAGE_SIZE = 20;

const safeUnlink = (filePath: string, retries = 3, delay = 100): void => {
  fs.unlink(filePath, (err) => {
    if (err && err.code === "EBUSY" && retries > 0) {
      setTimeout(() => safeUnlink(filePath, retries - 1, delay * 2), delay);
    }
  });
};

export class PhotoController {
  // Auto-link photo to any ACTIVE/UPCOMING activities for the same event
  

  static async uploadPhoto(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { title, event_date, description, faculty, academic_year, event_id } =
        req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!req.file) {
        res
          .status(400)
          .json({ success: false, message: "กรุณาเลือกไฟล์รูปภาพ" });
        return;
      }
      if (!title?.trim()) {
        safeUnlink(req.file.path);
        res.status(400).json({ success: false, message: "กรุณาเลือกกิจกรรม" });
        return;
      }
      if (!userId) {
        safeUnlink(req.file.path);
        res
          .status(401)
          .json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
        return;
      }

      const imageUrl = `${PHOTOS_URL_PREFIX}/${req.file.filename}`;
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileHash = crypto
        .createHash("md5")
        .update(fileBuffer)
        .digest("hex");

      // Check for duplicate using event_name (title = selected event name)
      const duplicate = await photoRepo.findDuplicateHash(
        title.trim(),
        fileHash
      );
      if (duplicate) {
        safeUnlink(req.file.path);
        const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
        res.status(409).json({
          success: false,
          message: `รูปภาพ "${req.file.originalname}" มีอยู่ใน Event นี้แล้ว`,
          duplicate: {
            id: duplicate.id,
            thumbnail_url: duplicate.thumbnail_url
              ? `${BASE_URL}${duplicate.thumbnail_url}`
              : null,
            image_url: duplicate.image_url
              ? `${BASE_URL}${duplicate.image_url}`
              : null,
            faculty: duplicate.faculty || "ไม่ระบุ",
            academic_year: duplicate.academic_year || "ไม่ระบุ",
          },
        });
        return;
      }

      let thumbnailUrl: string | null = null;
      try {
        thumbnailUrl = await createThumbnail(req.file.filename);
      } catch {
        // thumbnail failure is non-fatal
      }

      const finalFaculty = faculty?.trim() || "ไม่ระบุ";
      const finalYear = academic_year?.trim() || "ไม่ระบุ";

      const photo = await photoRepo.create({
        title: title.trim(),
        event_id: event_id ? parseInt(event_id) : null,
        event_date,
        description,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        faculty: finalFaculty,
        academic_year: finalYear,
        file_hash: fileHash,
        user_id: userId,
        created_by: userId,
      });


      await historyService.log({
        actorId: userId,
        action: "UPLOAD_PHOTO",
        targetType: "PHOTO",
        targetId: photo.id,
        detail: {
          title: title.trim(),
          faculty: finalFaculty,
          academic_year: finalYear,
        },
      });

      res.status(201).json({ success: true, data: photo });
    } catch (error: any) {
      if (req.file?.path && fs.existsSync(req.file.path))
        safeUnlink(req.file.path);
      sendError(res, error, "อัปโหลดรูปภาพไม่สำเร็จ");
    }
  }

  static async updatePhoto(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { title, event_date, description, faculty, academic_year, event_id } =
        req.body;
      const userId = req.user?.userId || req.user?.id;

      if (isNaN(id)) {
        res
          .status(400)
          .json({ success: false, message: "ID รูปภาพไม่ถูกต้อง" });
        return;
      }
      if (!userId) {
        res.status(401).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
        return;
      }

      const oldPhoto = await photoRepo.findById(id);
      if (!oldPhoto) {
        res
          .status(404)
          .json({ success: false, message: `ไม่พบรูปภาพ ID ${id}` });
        return;
      }

      let newImageUrl: string | undefined;
      let newThumbUrl: string | undefined;
      if (req.file) {
        newImageUrl = `${PHOTOS_URL_PREFIX}/${req.file.filename}`;
        try {
          newThumbUrl = await createThumbnail(req.file.filename);
        } catch {
          // non-fatal
        }
      }

      if (newImageUrl) deletePhotoFiles(oldPhoto.image_url, oldPhoto.thumbnail_url);

      const success = await photoRepo.update(id, {
        title,
        event_id:
          event_id !== undefined
            ? event_id
              ? parseInt(event_id)
              : null
            : undefined,
        event_date,
        description,
        image_url: newImageUrl,
        thumbnail_url: newThumbUrl,
        faculty:
          faculty !== undefined ? faculty?.trim() || "ไม่ระบุ" : undefined,
        academic_year:
          academic_year !== undefined
            ? academic_year?.trim() || "ไม่ระบุ"
            : undefined,
        updated_by: userId,
      });

      if (success) {
        await historyService.log({
          actorId: userId,
          action: "UPDATE_PHOTO",
          targetType: "PHOTO",
          targetId: id,
          detail: { updatedTitle: title, faculty: faculty || "ไม่ระบุ" },
        });
        res.status(200).json({ success: true, message: "แก้ไขรูปภาพสำเร็จ" });
      } else {
        if (req.file?.path) safeUnlink(req.file.path);
        res
          .status(404)
          .json({ success: false, message: `ไม่พบรูปภาพ ID ${id}` });
      }
    } catch (error: any) {
      if (req.file?.path && fs.existsSync(req.file.path))
        safeUnlink(req.file.path);
      sendError(res, error, "แก้ไขรูปภาพไม่สำเร็จ");
    }
  }

  static async deletePhoto(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const photoId = parseInt(req.params.id as string, 10);
      const userId = req.user?.userId || req.user?.id;
      if (isNaN(photoId)) {
        res
          .status(400)
          .json({ success: false, message: "ID รูปภาพไม่ถูกต้อง" });
        return;
      }
      if (!userId) {
        res.status(401).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
        return;
      }

      const photo = await photoRepo.findById(photoId);
      if (!photo) {
        res
          .status(404)
          .json({ success: false, message: `ไม่พบรูปภาพ ID ${photoId}` });
        return;
      }

      await historyService.log({
        actorId: userId,
        action: "DELETE_PHOTO",
        targetType: "PHOTO",
        targetId: photoId,
        detail: {
          deletedTitle: photo.title,
          faculty: photo.faculty || "ไม่ระบุ",
        },
      });

      const isDeleted = await photoRepo.hardDelete(photoId);
      if (isDeleted) {
        deletePhotoFiles(photo.image_url, photo.thumbnail_url);
        res.status(200).json({ success: true, message: "ลบรูปภาพสำเร็จ" });
      } else {
        res
          .status(404)
          .json({ success: false, message: `ไม่พบรูปภาพ ID ${photoId}` });
      }
    } catch (error: any) {
      sendError(res, error, "ลบรูปภาพไม่สำเร็จ");
    }
  }

  static async getPhotos(req: Request, res: Response): Promise<void> {
    try {
      const photos = await photoRepo.findAllActive();
      res.status(200).json({ success: true, data: photos });
    } catch (error: any) {
      sendError(res, error, "โหลดรูปภาพไม่สำเร็จ");
    }
  }

  static async getGroupedByEvent(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
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
      sendError(res, error, "โหลดข้อมูลแกลเลอรี่ไม่สำเร็จ");
    }
  }

  static async getPhotosByEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = parseInt(req.params.eventId as string, 10);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const offset = (page - 1) * PHOTO_PAGE_SIZE;
      if (isNaN(eventId)) {
        res
          .status(400)
          .json({ success: false, message: "Event ID ไม่ถูกต้อง" });
        return;
      }

      const faculty = req.query.faculty as string | undefined;
      const year = (req.query.year || req.query.academic_year) as
        | string
        | undefined;

      const [photos, total] = await Promise.all([
        photoRepo.findByEventAndCategory(
          eventId,
          faculty,
          year,
          PHOTO_PAGE_SIZE,
          offset
        ),
        photoRepo.countByEventAndCategory(eventId, faculty, year),
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
      sendError(res, error, "โหลดรูปภาพในกิจกรรมไม่สำเร็จ");
    }
  }

  static async getFiltersForEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = parseInt(req.params.eventId as string, 10);
      if (isNaN(eventId)) {
        res
          .status(400)
          .json({ success: false, message: "Event ID ไม่ถูกต้อง" });
        return;
      }
      const [faculties, academicYears] = await Promise.all([
        photoRepo.getFacultiesByEvent(eventId),
        photoRepo.getAcademicYearsByEvent(eventId),
      ]);
      res
        .status(200)
        .json({ success: true, data: { faculties, academicYears } });
    } catch (error: any) {
      sendError(res, error, "โหลดข้อมูล filter ไม่สำเร็จ");
    }
  }
}