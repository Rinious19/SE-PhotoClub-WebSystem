//? Service: Activity
//@ Business Logic สำหรับกิจกรรมโหวต
//  แยก Controller ออกจาก Repository ตาม 3-Tier Architecture

import { ActivityRepository } from '../repositories/ActivityRepository';
import { PhotoRepository }    from '../repositories/PhotoRepository';
import { CreateActivityDTO }  from '../dtos/CreateActivityDTO';
import { ActivityStatus }     from '../enums/ActivityStatus';

export class ActivityService {
  private activityRepo = new ActivityRepository();
  private photoRepo    = new PhotoRepository();

  //@ ดึงกิจกรรมทั้งหมด (sync status อัตโนมัติก่อน)
  async getAll(filters: {
    keyword?:  string;
    category?: string;
    status?:   ActivityStatus;
    dateFrom?: string;
    dateTo?:   string;
  } = {}) {
    // ซิงค์ status ตามเวลาปัจจุบันก่อนตอบ
    await this.activityRepo.syncStatuses();
    return await this.activityRepo.findAll(filters);
  }

  //@ ดึงกิจกรรมเดี่ยวพร้อมรูปและผลโหวต
  async getById(id: number) {
    await this.activityRepo.syncStatuses();
    const activity = await this.activityRepo.findByIdWithPhotos(id);
    if (!activity) throw new Error('ไม่พบกิจกรรมนี้');
    return activity;
  }

  //@ สร้างกิจกรรมใหม่ (CLUB_PRESIDENT เท่านั้น)
  async create(dto: CreateActivityDTO, creatorId: number): Promise<number> {
    //* ตรวจสอบข้อมูลพื้นฐาน
    if (!dto.title?.trim())      throw new Error('กรุณากรอกชื่อกิจกรรม');
    if (!dto.event_name?.trim()) throw new Error('กรุณาเลือกอีเว้นท์');
    if (!dto.start_at)           throw new Error('กรุณากำหนดวันเริ่มต้น');
    if (!dto.end_at)             throw new Error('กรุณากำหนดวันสิ้นสุด');

    const startDate = new Date(dto.start_at);
    const endDate   = new Date(dto.end_at);

    //! สำคัญ: ตรวจสอบ logic วันที่
    if (endDate <= startDate) {
      throw new Error('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');
    }

    // ดึงรูปทั้งหมดจากอีเว้นท์นั้น (เฉพาะที่ไม่ถูกลบ)
    const allPhotos = await this.photoRepo.findByEventAndCategory(
      dto.event_name, null, 9999, 0
    );

    // กรองรูปที่ CLUB_PRESIDENT เลือกเอาออก
    const excluded = new Set(dto.excluded_photo_ids ?? []);
    const photoIds = allPhotos
      .filter((p: any) => !excluded.has(p.id))
      .map((p: any) => p.id);

    if (photoIds.length === 0) {
      throw new Error('กิจกรรมต้องมีรูปภาพอย่างน้อย 1 รูป');
    }

    //* กำหนด status เริ่มต้นตามเวลา
    const now    = new Date();
    let status: ActivityStatus;
    if (startDate > now)  status = ActivityStatus.UPCOMING;
    else if (endDate < now) status = ActivityStatus.ENDED;
    else                    status = ActivityStatus.ACTIVE;

    return await this.activityRepo.create(
      {
        title:       dto.title.trim(),
        description: dto.description?.trim() ?? undefined,
        category:    dto.category?.trim()    ?? undefined,
        event_name:  dto.event_name.trim(),
        start_at:    dto.start_at,
        end_at:      dto.end_at,
        status,
        created_by:  creatorId,
      },
      photoIds
    );
  }

  //@ อัปเดตกิจกรรม (ADMIN ปรับเวลา/ข้อมูล)
  async update(
    id: number,
    data: { title?: string; description?: string; category?: string; start_at?: string; end_at?: string; status?: ActivityStatus }
  ): Promise<void> {
    // ตรวจสอบว่ากิจกรรมมีอยู่จริง
    const existing = await this.activityRepo.findByIdWithPhotos(id);
    if (!existing) throw new Error('ไม่พบกิจกรรมนี้');

    // ถ้าส่ง end_at ใหม่ ต้องตรวจสอบว่าไม่น้อยกว่า start_at
    if (data.end_at && data.start_at) {
      if (new Date(data.end_at) <= new Date(data.start_at)) {
        throw new Error('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');
      }
    }

    const success = await this.activityRepo.update(id, data);
    if (!success) throw new Error('อัปเดตกิจกรรมไม่สำเร็จ');
  }

  //@ ลบรูปออกจากกิจกรรม (CLUB_PRESIDENT / ADMIN)
  async removePhoto(activityId: number, activityPhotoId: number): Promise<void> {
    const success = await this.activityRepo.removePhotoFromActivity(activityId, activityPhotoId);
    if (!success) throw new Error('ไม่พบรูปภาพในกิจกรรมนี้');
  }
}