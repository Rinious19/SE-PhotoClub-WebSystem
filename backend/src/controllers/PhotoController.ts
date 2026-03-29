//? Controller: Photo Controller
//@ รับ Request → เรียก Repository → บันทึก History Log

import { Request, Response } from "express";
import { PhotoRepository } from "../repositories/PhotoRepository";
import { historyService } from "../services/HistoryService"; // ← เพิ่มบรรทัดนี้
import { AuthenticatedRequest } from "../middlewares/AuthMiddleware";
import { sendError } from "../utils/errorHandler";
import { createThumbnail, deletePhotoFiles, PHOTOS_URL_PREFIX } from "../middlewares/UploadMiddleware";
import fs from "fs";
import crypto from "crypto";

const photoRepo = new PhotoRepository();
const FOLDER_PAGE_SIZE = 12;
const PHOTO_PAGE_SIZE  = 20;
const UPLOADS_URL_PREFIX = PHOTOS_URL_PREFIX;

export class PhotoController {

  // --- [1. อัปโหลดรูป] ---
  static async uploadPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, event_date, description, faculty, academic_year } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!req.file) { res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์รูปภาพ' }); return; }
      if (!title?.trim()) { fs.unlinkSync(req.file.path); res.status(400).json({ success: false, message: 'กรุณาเลือกกิจกรรม' }); return; }
      if (!userId) { fs.unlinkSync(req.file.path); res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' }); return; }

      const imageUrl   = `${UPLOADS_URL_PREFIX}/${req.file.filename}`;
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileHash   = crypto.createHash('md5').update(fileBuffer).digest('hex');

      const duplicate = await photoRepo.findDuplicateHash(title.trim(), fileHash);
      if (duplicate) {
        fs.unlinkSync(req.file.path);
        const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
        res.status(409).json({
          success: false,
          message: `รูปภาพ "${req.file.originalname}" มีอยู่ใน Event นี้แล้ว`,
          duplicate: {
            id:            duplicate.id,
            thumbnail_url: duplicate.thumbnail_url ? `${BASE_URL}${duplicate.thumbnail_url}` : null,
            image_url:     duplicate.image_url     ? `${BASE_URL}${duplicate.image_url}`     : null,
            faculty:       duplicate.faculty       || null,
            academic_year: duplicate.academic_year || null,
          },
        });
        return;
      }

      let thumbnailUrl: string | null = null;
      try { thumbnailUrl = await createThumbnail(req.file.filename); } catch { /* thumbnail fail ไม่ block */ }

      const photo = await photoRepo.create({
        title: title.trim(), event_date, description,
        image_url: imageUrl, thumbnail_url: thumbnailUrl,
        faculty: faculty?.trim() || null,
        academic_year: academic_year?.trim() || null,
        file_hash: fileHash,
        user_id: userId, created_by: userId,
      });

      //! สิ่งที่สำคัญมาก — บันทึกลง history_logs (ไม่ใช่ photo_audit_logs)
      await historyService.log({
        actorId:    userId,
        action:     'UPLOAD_PHOTO',
        targetType: 'PHOTO',
        targetId:   photo.id,
        detail:     { title: title.trim(), faculty: faculty || null, academic_year: academic_year || null },
      });

      res.status(201).json({ success: true, data: photo });
    } catch (error: any) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      sendError(res, error, 'อัปโหลดรูปภาพไม่สำเร็จ');
    }
  }

  // --- [2. แก้ไขรูป] ---
  static async updatePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id     = parseInt(req.params.id as string, 10);
      const { title, event_date, description, faculty, academic_year } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (isNaN(id))  { res.status(400).json({ success: false, message: 'ID รูปภาพไม่ถูกต้อง' }); return; }
      if (!userId)    { res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' }); return; }

      let newImageUrl: string | undefined;
      let newThumbUrl: string | undefined;
      if (req.file) {
        newImageUrl = `${UPLOADS_URL_PREFIX}/${req.file.filename}`;
        try { newThumbUrl = await createThumbnail(req.file.filename); } catch { /* thumbnail fail ไม่ block */ }
      }

      if (newImageUrl) {
        const old = await photoRepo.findById(id);
        if (old) deletePhotoFiles(old.image_url, old.thumbnail_url);
      }

      const success = await photoRepo.update(id, {
        title, event_date, description,
        image_url: newImageUrl, thumbnail_url: newThumbUrl,
        faculty:       faculty       !== undefined ? (faculty?.trim()       || null) : undefined,
        academic_year: academic_year !== undefined ? (academic_year?.trim() || null) : undefined,
        updated_by: userId,
      });

      if (success) {
        //! สิ่งที่สำคัญมาก — บันทึกลง history_logs
        await historyService.log({
          actorId:    userId,
          action:     'UPDATE_PHOTO', //! ใช้ UPLOAD_PHOTO เพราะยังไม่มี UPDATE_PHOTO ใน HistoryAction
          targetType: 'PHOTO',
          targetId:   id,
          detail:     { updatedTitle: title, faculty: faculty || null },
        });
        res.status(200).json({ success: true, message: 'แก้ไขรูปภาพสำเร็จ' });
      } else {
        if (req.file?.path) fs.unlinkSync(req.file.path);
        res.status(404).json({ success: false, message: `ไม่พบรูปภาพ ID ${id}` });
      }
    } catch (error: any) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      sendError(res, error, 'แก้ไขรูปภาพไม่สำเร็จ');
    }
  }

  // --- [3. ลบรูป] ---
  static async deletePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const photoId = parseInt(req.params.id as string, 10);
      const userId  = req.user?.userId || req.user?.id;

      if (isNaN(photoId)) { res.status(400).json({ success: false, message: 'ID รูปภาพไม่ถูกต้อง' }); return; }
      if (!userId)        { res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' }); return; }

      const photo = await photoRepo.findById(photoId);
      if (!photo) { res.status(404).json({ success: false, message: `ไม่พบรูปภาพ ID ${photoId}` }); return; }

      //! สิ่งที่สำคัญมาก — log ก่อนลบ เพราะ FK จะทำให้ log หลังลบไม่ได้
      await historyService.log({
        actorId:    userId,
        action:     'DELETE_PHOTO',
        targetType: 'PHOTO',
        targetId:   photoId,
        detail:     { deletedTitle: photo.title, faculty: photo.faculty || null },
      });

      const isDeleted = await photoRepo.hardDelete(photoId);
      if (isDeleted) {
        deletePhotoFiles(photo.image_url, photo.thumbnail_url);
        res.status(200).json({ success: true, message: 'ลบรูปภาพสำเร็จ' });
      } else {
        res.status(404).json({ success: false, message: `ไม่พบรูปภาพ ID ${photoId}` });
      }
    } catch (error: any) {
      sendError(res, error, 'ลบรูปภาพไม่สำเร็จ');
    }
  }

  // --- [4-6. ส่วนที่เหลือเหมือนเดิม ไม่ต้องแก้] ---
  static async getPhotos(req: Request, res: Response): Promise<void> {
    try {
      const photos = await photoRepo.findAllActive();
      res.status(200).json({ success: true, data: photos });
    } catch (error: any) { sendError(res, error, 'โหลดรูปภาพไม่สำเร็จ'); }
  }

  static async getGroupedByEvent(req: Request, res: Response): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page as string) || 1);
      const offset = (page - 1) * FOLDER_PAGE_SIZE;
      const [groups, total] = await Promise.all([
        photoRepo.findGroupedByEvent(FOLDER_PAGE_SIZE, offset),
        photoRepo.countGroups(),
      ]);
      res.status(200).json({ success: true, data: groups, pagination: { page, pageSize: FOLDER_PAGE_SIZE, total, totalPages: Math.ceil(total / FOLDER_PAGE_SIZE), hasMore: offset + groups.length < total } });
    } catch (error: any) { sendError(res, error, 'โหลดข้อมูลแกลเลอรี่ไม่สำเร็จ'); }
  }

  static async getPhotosByEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventName    = decodeURIComponent(req.params.eventName as string);
      const page         = Math.max(1, parseInt(req.query.page as string) || 1);
      const hasFaculty   = req.query.faculty       !== undefined;
      const hasAcademic  = req.query.academic_year !== undefined;
      const faculty      = hasFaculty  ? (req.query.faculty       as string) : null;
      const academic_year = hasAcademic ? (req.query.academic_year as string) : null;
      const offset       = (page - 1) * PHOTO_PAGE_SIZE;
      const category     = (hasFaculty || hasAcademic) ? { faculty, academic_year } : null;
      const [photos, total] = await Promise.all([
        photoRepo.findByEventAndCategory(eventName, category, PHOTO_PAGE_SIZE, offset),
        photoRepo.countByEventAndCategory(eventName, category),
      ]);
      res.status(200).json({ success: true, data: photos, pagination: { page, pageSize: PHOTO_PAGE_SIZE, total, totalPages: Math.ceil(total / PHOTO_PAGE_SIZE), hasMore: offset + photos.length < total } });
    } catch (error: any) { sendError(res, error, 'โหลดรูปภาพในกิจกรรมไม่สำเร็จ'); }
  }

  static async getFiltersForEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventName = decodeURIComponent(req.params.eventName as string);
      const [faculties, academicYears] = await Promise.all([
        photoRepo.getFacultiesByEvent(eventName),
        photoRepo.getAcademicYearsByEvent(eventName),
      ]);
      res.status(200).json({ success: true, data: { faculties, academicYears } });
    } catch (error: any) { sendError(res, error, 'โหลดข้อมูล filter ไม่สำเร็จ'); }
  }
}