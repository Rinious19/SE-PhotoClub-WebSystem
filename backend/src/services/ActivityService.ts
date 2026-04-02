//? Service: ActivityService
//@ backend/src/services/ActivityService.ts

import { ActivityRepository } from "../repositories/ActivityRepository";
import { PhotoRepository } from "../repositories/PhotoRepository";
import { ActivityStatus } from "../enums/ActivityStatus";

export class ActivityService {
  private activityRepo = new ActivityRepository();
  private photoRepo = new PhotoRepository();

  // ✅ Get all activities (sync statuses first)
  async getAll(filters: any) {
    await this.activityRepo.syncStatuses();
    return await this.activityRepo.findAll(filters);
  }

  // ✅ Get single activity with photos
  async getById(id: number) {
    await this.activityRepo.syncStatuses();
    const activity = await this.activityRepo.findByIdWithPhotos(id);
    if (!activity) throw new Error("ไม่พบกิจกรรมนี้");
    return activity;
  }

  // ✅ Create a new voting activity (CLUB_PRESIDENT only)
  async create(dto: any, creatorId: number) {
    if (!dto.title?.trim()) throw new Error("กรุณากรอกชื่อกิจกรรม");
    if (!dto.event_id) throw new Error("กรุณาเลือกอีเว้นท์เพื่อดึงรูปภาพ");
    if (!dto.start_at || !dto.end_at)
      throw new Error("กรุณากำหนดช่วงเวลาเริ่มต้นและสิ้นสุด");

    const startDate = new Date(dto.start_at);
    const endDate = new Date(dto.end_at);
    if (endDate <= startDate)
      throw new Error("วันสิ้นสุดต้องมาหลังวันเริ่มต้น");

    const faculty      = dto.faculty || dto.category || null;
    const academicYear = dto.academic_year || dto.year || null;

    // Fetch photos for this event
    const eventPhotos = await this.photoRepo.findByEventAndCategory(
      dto.event_id,
      faculty,
      academicYear,
      1000,
      0
    );

    const excludedIds = new Set<number>(dto.excluded_photo_ids || []);
    const photoIds = eventPhotos
      .map((p: any) => p.id)
      .filter((id: number) => !excludedIds.has(id));

    if (photoIds.length === 0)
      throw new Error("อีเว้นท์ที่เลือกไม่มีรูปภาพสำหรับการโหวต");

    const now = new Date();
    let status = ActivityStatus.UPCOMING;
    if (now >= startDate && now <= endDate) status = ActivityStatus.ACTIVE;
    else if (now > endDate) status = ActivityStatus.ENDED;

    return await this.activityRepo.create({
      ...dto,
      faculty,        
      category: faculty, 
      academic_year: academicYear,
      created_by: creatorId,
      status,
    }, photoIds);
  }

  // ✅ Update activity metadata
  async update(id: number, data: any) {
    const existing = await this.activityRepo.findByIdWithPhotos(id);
    if (!existing) throw new Error('ไม่พบกิจกรรมที่ต้องการแก้ไข');

    // 1. ตรวจสอบวันเวลาและสถานะ
    if (data.start_at && data.end_at) {
      const startDate = new Date(data.start_at);
      const endDate   = new Date(data.end_at);
      if (endDate <= startDate) throw new Error('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');

      const now = new Date();
      let status = ActivityStatus.UPCOMING;
      if (now >= startDate && now <= endDate) status = ActivityStatus.ACTIVE;
      else if (now > endDate) status = ActivityStatus.ENDED;
      data.status = status;
    }

    let photoIds: number[] | undefined = undefined;

    // 2. จัดการรูปภาพ (ถ้ามีการส่ง excluded_photo_ids มา)
    if (data.excluded_photo_ids !== undefined) {
      const eventIdToUse = data.event_id; 
      if (!eventIdToUse) throw new Error('ไม่พบข้อมูล Event ID สำหรับคำนวณรูปภาพ');

      const faculty      = data.faculty !== undefined ? data.faculty : existing.faculty;
      const academicYear = data.academic_year !== undefined ? data.academic_year : existing.academic_year;

      let eventPhotos = await this.photoRepo.findByEventAndCategory(
        eventIdToUse, 
        faculty, 
        academicYear,
        1000, 
        0
      );

      const excludedIds = new Set<number>(data.excluded_photo_ids);
      photoIds = eventPhotos
        .map((p: any) => p.id)
        .filter((id: number) => !excludedIds.has(id));

      if (photoIds.length === 0) throw new Error('กิจกรรมต้องมีรูปภาพอย่างน้อย 1 รูป');
    }

    const success = await this.activityRepo.update(id, data, photoIds);
    if (!success) throw new Error('ไม่สามารถแก้ไขกิจกรรมได้');
    
    await this.activityRepo.syncStatuses();
  }

  // ✅ Remove a photo from an activity
  async removePhoto(activityId: number, activityPhotoId: number): Promise<void> {
    const success = await this.activityRepo.removePhotoFromActivity(
      activityId,
      activityPhotoId
    );
    if (!success) throw new Error("ไม่พบรูปภาพในกิจกรรมนี้ หรือลบไม่สำเร็จ");
  }

  /**
   * ✅ ฟังก์ชันลบผู้ใช้งานถาวร (Hard Delete)
   * เพิ่มเข้ามาเพื่อให้ Controller เรียกใช้งานได้ตามความต้องการของคุณ
   */
  async hardDeleteUser(id: number): Promise<boolean> {
    try {
      // เรียกใช้ Repository ที่ทำหน้าที่ Hard Delete 
      // (ตรวจสอบให้แน่ใจว่าใน ActivityRepository มีเมธอด hardDeleteUser แล้ว)
      const result = await (this.activityRepo as any).hardDeleteUser(id);
      return result;
    } catch (error) {
      console.error("Error in hardDeleteUser Service:", error);
      throw new Error("เกิดข้อผิดพลาดในการลบข้อมูลผู้ใช้ถาวร");
    }
  }
}