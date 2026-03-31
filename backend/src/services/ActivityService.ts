import { ActivityRepository } from '../repositories/ActivityRepository';
import { PhotoRepository }    from '../repositories/PhotoRepository';
import { ActivityStatus }     from '../enums/ActivityStatus';

export class ActivityService {
  private activityRepo = new ActivityRepository();
  private photoRepo    = new PhotoRepository();

  //@ ดึงกิจกรรมทั้งหมด (Sync สถานะก่อนเสมอ)
  async getAll(filters: any) {
    await this.activityRepo.syncStatuses();
    return await this.activityRepo.findAll(filters);
  }

  //@ ดึงกิจกรรมเดี่ยวพร้อมรูปภาพ
  async getById(id: number) {
    await this.activityRepo.syncStatuses();
    const activity = await this.activityRepo.findByIdWithPhotos(id);
    if (!activity) throw new Error('ไม่พบกิจกรรมนี้');
    return activity;
  }

  //@ สร้างกิจกรรมใหม่ (CLUB_PRESIDENT)
  async create(dto: any, creatorId: number) {
    if (!dto.title?.trim())  throw new Error('กรุณากรอกชื่อกิจกรรม');
    if (!dto.event_id)       throw new Error('กรุณาเลือกอีเว้นท์เพื่อดึงรูปภาพ');
    if (!dto.start_at || !dto.end_at) throw new Error('กรุณากำหนดช่วงเวลาเริ่มต้นและสิ้นสุด');

    const startDate = new Date(dto.start_at);
    const endDate   = new Date(dto.end_at);
    if (endDate <= startDate) throw new Error('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');

    const faculty      = dto.faculty || dto.category || null;
    const academicYear = dto.academic_year || dto.year || null;

    let eventPhotos = await this.photoRepo.findByEventAndCategory(
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

    if (photoIds.length === 0) throw new Error('อีเว้นท์ที่เลือกไม่มีรูปภาพสำหรับการโหวต');

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

  //@ อัปเดตข้อมูลกิจกรรม
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

    // 2. จัดการรูปภาพ (ถ้ามีการส่ง excluded_photo_ids มาจากหน้าเว็บ)
    if (data.excluded_photo_ids !== undefined) {
      // ✅ ใช้ data.event_id ที่ส่งมาจากหน้าเว็บ เพราะ existing ไม่มี event_id
      const eventIdToUse = data.event_id; 
      if (!eventIdToUse) throw new Error('ไม่พบข้อมูล Event ID สำหรับคำนวณรูปภาพ');

      // ดึงตัวกรองใหม่ หรือใช้ของเดิม
      const faculty      = data.faculty !== undefined ? data.faculty : existing.faculty;
      const academicYear = data.academic_year !== undefined ? data.academic_year : existing.academic_year;

      // ดึงรูปทั้งหมดของ Event นี้ตาม Filter ใหม่
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

    // 3. ส่งข้อมูลไปอัปเดต (แนบ photoIds ไปด้วย)
    const success = await this.activityRepo.update(id, data, photoIds);
    if (!success) throw new Error('ไม่สามารถแก้ไขกิจกรรมได้');
    
    await this.activityRepo.syncStatuses();
  }

  //@ ลบรูปออกจากกิจกรรม
  async removePhoto(activityId: number, activityPhotoId: number): Promise<void> {
    const success = await this.activityRepo.removePhotoFromActivity(activityId, activityPhotoId);
    if (!success) throw new Error('ไม่พบรูปภาพในกิจกรรมนี้ หรือลบไม่สำเร็จ');
  }
}