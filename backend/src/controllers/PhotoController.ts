//? Controller: Photo Controller
//@ รับ Request → เรียก Repository → บันทึก History Log

import { Request, Response } from "express";
import { PhotoRepository } from "../repositories/PhotoRepository";
import { historyService } from "../services/HistoryService";
import { AuthenticatedRequest } from "../middlewares/AuthMiddleware";
import { sendError } from "../utils/errorHandler";
import { createThumbnail, deletePhotoFiles, PHOTOS_URL_PREFIX } from "../middlewares/UploadMiddleware";
import fs from "fs";
import crypto from "crypto";
import { pool } from "../config/Database";

const photoRepo = new PhotoRepository();
const FOLDER_PAGE_SIZE = 12;
const PHOTO_PAGE_SIZE  = 20;
const UPLOADS_URL_PREFIX = PHOTOS_URL_PREFIX;

//! Windows fix — unlinkSync ทำให้เกิด EBUSY เพราะ OS ยังล็อคไฟล์อยู่
const safeUnlink = (filePath: string, retries = 3, delay = 100): void => {
  fs.unlink(filePath, (err) => {
    if (err && err.code === 'EBUSY' && retries > 0) {
      setTimeout(() => safeUnlink(filePath, retries - 1, delay * 2), delay);
    }
  });
};

export class PhotoController {

  // ✅ ฟังก์ชันผู้ช่วย: เดาหมวดหมู่ของกิจกรรมโหวตจากรูปภาพข้างใน และดึงรูปเข้าอัตโนมัติ
  static async autoSyncPhotoToActivities(photoId: number, eventId: number | null, faculty: string | null, year: string | null) {
    if (!eventId) return;

    // ค้นหากิจกรรมที่ Active และดูว่ารูปภาพข้างในกิจกรรมนั้นเป็นของ Event/คณะ/ปี ไหน
    const sql = `
      SELECT a.id AS activity_id,
             MIN(p.event_id) AS min_event, MAX(p.event_id) AS max_event,
             MIN(p.faculty) AS min_fac, MAX(p.faculty) AS max_fac,
             MIN(p.academic_year) AS min_year, MAX(p.academic_year) AS max_year
      FROM activities a
      JOIN activity_photos ap ON a.id = ap.activity_id
      JOIN photos p ON ap.photo_id = p.id
      WHERE a.status != 'ENDED'
      GROUP BY a.id
    `;
    const [activeActs]: any = await pool.query(sql);

    for (const act of activeActs) {
      // 1. เช็คว่าเป็นกิจกรรมโหวตของ Event เดียวกันหรือไม่
      if (act.min_event === eventId && act.max_event === eventId) {
        let isMatch = true;

        // 2. ถ้ากิจกรรมโหวตนี้มีแต่รูปของ "คณะเดียว" ล้วนๆ รูปใหม่ก็ต้องเป็นคณะนั้นด้วย
        if (act.min_fac !== null && act.min_fac === act.max_fac && faculty !== act.min_fac) {
          isMatch = false;
        }
        // 3. ถ้ากิจกรรมโหวตนี้มีแต่รูปของ "ปีเดียวกัน" ล้วนๆ รูปใหม่ก็ต้องเป็นปีนั้นด้วย
        if (act.min_year !== null && act.min_year === act.max_year && year !== act.min_year) {
          isMatch = false;
        }

        // ถ้ารูปใหม่คุณสมบัติตรงกับกิจกรรมโหวตนี้ ก็ยัดใส่ลงไปเลย
        if (isMatch) {
          const [check]: any = await pool.query('SELECT id FROM activity_photos WHERE activity_id = ? AND photo_id = ?', [act.activity_id, photoId]);
          if (check.length === 0) { // กันเหนียว ไม่ให้รูปซ้ำ
            const [maxSortRows]: any = await pool.query('SELECT MAX(sort_order) as maxSort FROM activity_photos WHERE activity_id = ?', [act.activity_id]);
            const nextSort = (maxSortRows[0]?.maxSort || 0) + 1;
            await pool.query(
              'INSERT INTO activity_photos (activity_id, photo_id, sort_order) VALUES (?, ?, ?)',
              [act.activity_id, photoId, nextSort]
            );
          }
        }
      }
    }
  }

  // --- [1. อัปโหลดรูป] ---
  static async uploadPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, event_date, description, faculty, academic_year, event_id } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!req.file) { res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์รูปภาพ' }); return; }
      if (!title?.trim()) { safeUnlink(req.file.path); res.status(400).json({ success: false, message: 'กรุณาเลือกกิจกรรม' }); return; }
      if (!userId) { safeUnlink(req.file.path); res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' }); return; }

      const imageUrl   = `${UPLOADS_URL_PREFIX}/${req.file.filename}`;
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileHash   = crypto.createHash('md5').update(fileBuffer).digest('hex');

      const duplicate = await photoRepo.findDuplicateHash(title.trim(), fileHash);
      if (duplicate) {
        safeUnlink(req.file.path);
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
      try { thumbnailUrl = await createThumbnail(req.file.filename); } catch { /* fail ไม่ block */ }

      const photo = await photoRepo.create({
        title: title.trim(),
        event_id: event_id ? parseInt(event_id) : null,
        event_date,
        description,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        faculty: faculty?.trim() || null,
        academic_year: academic_year?.trim() || null,
        file_hash: fileHash,
        user_id: userId,
        created_by: userId,
      });

      // ✅ ค้นหาและดึงรูปลงกิจกรรมโหวตอัตโนมัติ (สืบจากรูปที่มีอยู่)
      await PhotoController.autoSyncPhotoToActivities(photo.id, photo.event_id, photo.faculty, photo.academic_year);

      await historyService.log({
        actorId:    userId,
        action:     'UPLOAD_PHOTO',
        targetType: 'PHOTO',
        targetId:   photo.id,
        detail:     { title: title.trim(), faculty: faculty || null, academic_year: academic_year || null },
      });

      res.status(201).json({ success: true, data: photo });
    } catch (error: any) {
      if (req.file?.path && fs.existsSync(req.file.path)) safeUnlink(req.file.path);
      sendError(res, error, 'อัปโหลดรูปภาพไม่สำเร็จ');
    }
  }

  // --- [2. แก้ไขรูป] ---
  static async updatePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id     = parseInt(req.params.id as string, 10);
      const { title, event_date, description, faculty, academic_year, event_id } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (isNaN(id))  { res.status(400).json({ success: false, message: 'ID รูปภาพไม่ถูกต้อง' }); return; }
      if (!userId)    { res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' }); return; }

      const oldPhoto = await photoRepo.findById(id);
      if (!oldPhoto) {
        res.status(404).json({ success: false, message: `ไม่พบรูปภาพ ID ${id}` });
        return;
      }

      let newImageUrl: string | undefined;
      let newThumbUrl: string | undefined;
      if (req.file) {
        newImageUrl = `${UPLOADS_URL_PREFIX}/${req.file.filename}`;
        try { newThumbUrl = await createThumbnail(req.file.filename); } catch { /* fail ไม่ block */ }
      }

      if (newImageUrl) {
        deletePhotoFiles(oldPhoto.image_url, oldPhoto.thumbnail_url);
      }

      const success = await photoRepo.update(id, {
        title,
        event_id: event_id !== undefined ? (event_id ? parseInt(event_id) : null) : undefined,
        event_date,
        description,
        image_url: newImageUrl,
        thumbnail_url: newThumbUrl,
        faculty:       faculty       !== undefined ? (faculty?.trim()       || null) : undefined,
        academic_year: academic_year !== undefined ? (academic_year?.trim() || null) : undefined,
        updated_by: userId,
      });

      if (success) {
        const newEventId = event_id !== undefined ? (event_id ? parseInt(event_id) : null) : oldPhoto.event_id;
        const newFaculty = faculty !== undefined ? (faculty?.trim() || null) : oldPhoto.faculty;
        const newYear = academic_year !== undefined ? (academic_year?.trim() || null) : oldPhoto.academic_year;

        // ถ้าย้ายหมวดหมู่ (คณะ, ปี, อีเว้นท์) ให้จัดการเรื่องการโหวต
        if (oldPhoto.event_id !== newEventId || oldPhoto.faculty !== newFaculty || oldPhoto.academic_year !== newYear) {
          
          // เตะรูปนี้ออกจาก "กิจกรรมโหวต" เดิม
          await pool.query('DELETE FROM activity_photos WHERE photo_id = ?', [id]);

          // ✅ ส่งไปค้นหาที่อยู่ใหม่ ถ้าระบบเจอโหวตที่ตรงสเปก มันจะเข้าไปอยู่เองอัตโนมัติ
          await PhotoController.autoSyncPhotoToActivities(id, newEventId, newFaculty, newYear);
        }

        await historyService.log({
          actorId:    userId,
          action:     'UPDATE_PHOTO',
          targetType: 'PHOTO',
          targetId:   id,
          detail:     { updatedTitle: title, faculty: faculty || null },
        });
        res.status(200).json({ success: true, message: 'แก้ไขรูปภาพสำเร็จ' });
      } else {
        if (req.file?.path) safeUnlink(req.file.path);
        res.status(404).json({ success: false, message: `ไม่พบรูปภาพ ID ${id}` });
      }
    } catch (error: any) {
      if (req.file?.path && fs.existsSync(req.file.path)) safeUnlink(req.file.path);
      sendError(res, error, 'แก้ไขรูปภาพไม่สำเร็จ');
    }
  }

  // --- [3. ลบรูป] ---
  static async deletePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const photoId = parseInt(req.params.id as string, 10);
      const userId  = req.user?.userId || req.user?.id;

      if (isNaN(photoId)) { res.status(400).json({ success: false, message: 'ID รูปภาพไม่ถูกต้อง' }); return; }
      if (!userId)         { res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' }); return; }

      const photo = await photoRepo.findById(photoId);
      if (!photo) { res.status(404).json({ success: false, message: `ไม่พบรูปภาพ ID ${photoId}` }); return; }

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

  // --- [4. ดึงรูปทั้งหมด (Active)] ---
  static async getPhotos(req: Request, res: Response): Promise<void> {
    try {
      const photos = await photoRepo.findAllActive();
      res.status(200).json({ success: true, data: photos });
    } catch (error: any) { sendError(res, error, 'โหลดรูปภาพไม่สำเร็จ'); }
  }

  // --- [5. ดึงรูปแบบ Grouped by Event (หน้าแกลเลอรี่)] ---
  static async getGroupedByEvent(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const offset = (page - 1) * FOLDER_PAGE_SIZE;

      const [groups, total] = await Promise.all([
        photoRepo.findGroupedByEvent(FOLDER_PAGE_SIZE, offset),
        photoRepo.countGroups()
      ]);

      res.status(200).json({
        success: true,
        data: groups,
        pagination: {
          page,
          pageSize: FOLDER_PAGE_SIZE,
          total,
          totalPages: Math.ceil(total / FOLDER_PAGE_SIZE),
          hasMore: offset + groups.length < total
        }
      });
    } catch (error: any) {
      sendError(res, error, 'โหลดข้อมูลแกลเลอรี่ไม่สำเร็จ');
    }
  }

  // --- [6. ดึงรูปตาม Event ID (หน้า Folder)] ---
  static async getPhotosByEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = parseInt(req.params.eventId as string, 10);
      const page    = Math.max(1, parseInt(req.query.page as string) || 1);
      const offset  = (page - 1) * PHOTO_PAGE_SIZE;

      if (isNaN(eventId)) {
        res.status(400).json({ success: false, message: 'Event ID ไม่ถูกต้อง' });
        return;
      }

      const faculty = req.query.faculty ? (req.query.faculty as string) : null;
      const year    = req.query.year ? (req.query.year as string) : (req.query.academic_year as string || null);

      const [photos, total] = await Promise.all([
        photoRepo.findByEventAndCategory(eventId, faculty, year, PHOTO_PAGE_SIZE, offset),
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
          hasMore: offset + photos.length < total 
        }
      });
    } catch (error: any) {
      sendError(res, error, 'โหลดรูปภาพในกิจกรรมไม่สำเร็จ');
    }
  }

  // --- [7. ดึง Filter (คณะ / ปีการศึกษา) ตาม Event] ---
  static async getFiltersForEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = parseInt(req.params.eventId as string, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ success: false, message: 'Event ID ไม่ถูกต้อง' });
        return;
      }
      const [faculties, academicYears] = await Promise.all([
        photoRepo.getFacultiesByEvent(eventId),
        photoRepo.getAcademicYearsByEvent(eventId),
      ]);
      res.status(200).json({ success: true, data: { faculties, academicYears } });
    } catch (error: any) { sendError(res, error, 'โหลดข้อมูล filter ไม่สำเร็จ'); }
  }
}