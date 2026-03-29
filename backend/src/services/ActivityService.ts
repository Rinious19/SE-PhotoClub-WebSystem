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
    //! ใช้ event_id แทน event_name — FK ที่แน่นอน ไม่ขึ้นกับชื่อ
    if (!dto.event_id)       throw new Error('กรุณาเลือกอีเว้นท์เพื่อดึงรูปภาพ');
    if (!dto.start_at || !dto.end_at) throw new Error('กรุณากำหนดช่วงเวลาเริ่มต้นและสิ้นสุด');

    const startDate = new Date(dto.start_at);
    const endDate   = new Date(dto.end_at);
    if (endDate <= startDate) throw new Error('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');

    //* context — ดึงรูปด้วย event_id (FK) แทน event_name string
    //* และกรองตาม faculty / academic_year ถ้ามีการเลือก
    const faculty      = dto.faculty       || null;
    const academicYear = dto.academic_year || null;

    let eventPhotos = await this.photoRepo.findByEventAndCategory(
      dto.event_id, faculty, 1000, 0
    );

    //? กรอง academic_year เพิ่มเติม (findByEventAndCategory รับแค่ faculty)
    if (academicYear) {
      eventPhotos = eventPhotos.filter((p: any) => p.academic_year === academicYear);
    }

    //? ลบรูปที่ user เลือก exclude ออก
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
      created_by: creatorId,
      status,
    }, photoIds);
  }

  //@ อัปเดตข้อมูลกิจกรรม
  async update(id: number, data: any) {
    const existing = await this.activityRepo.findByIdWithPhotos(id);
    if (!existing) throw new Error('ไม่พบกิจกรรมที่ต้องการแก้ไข');
    const success = await this.activityRepo.update(id, data);
    if (!success) throw new Error('ไม่สามารถแก้ไขกิจกรรมได้');
    await this.activityRepo.syncStatuses();
  }

  //@ ลบรูปออกจากกิจกรรม
  async removePhoto(activityId: number, activityPhotoId: number): Promise<void> {
    const success = await this.activityRepo.removePhotoFromActivity(activityId, activityPhotoId);
    if (!success) throw new Error('ไม่พบรูปภาพในกิจกรรมนี้ หรือลบไม่สำเร็จ');
  }
}