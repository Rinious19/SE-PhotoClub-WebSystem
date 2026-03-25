//? Service: Vote
//@ Business Logic สำหรับการโหวต
//  ตรวจสอบสิทธิ์, ป้องกันโหวตซ้ำ, ตรวจสถานะกิจกรรม

import { VoteRepository }     from '../repositories/VoteRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { ActivityStatus }     from '../enums/ActivityStatus';
import { VoteDTO }            from '../dtos/VoteDTO';

export class VoteService {
  private voteRepo     = new VoteRepository();
  private activityRepo = new ActivityRepository();

  //@ ดำเนินการโหวต
  async castVote(dto: VoteDTO, userId: number): Promise<void> {
    // [1] sync status ก่อน เพื่อให้ได้สถานะล่าสุด
    await this.activityRepo.syncStatuses();

    // [2] ดึงกิจกรรม
    const activity = await this.activityRepo.findByIdWithPhotos(dto.activity_id);
    if (!activity) throw new Error('ไม่พบกิจกรรมนี้');

    //! สำคัญ: ตรวจสอบว่ากิจกรรมยัง ACTIVE อยู่
    if (activity.status !== ActivityStatus.ACTIVE) {
      if (activity.status === ActivityStatus.UPCOMING) {
        throw new Error('กิจกรรมยังไม่เปิดรับโหวต กรุณารอถึงวันเริ่มต้น');
      }
      throw new Error('กิจกรรมนี้สิ้นสุดแล้ว ไม่สามารถโหวตได้');
    }

    // [3] ตรวจว่าโหวตไปแล้วหรือยัง
    const existing = await this.voteRepo.findUserVote(dto.activity_id, userId);
    if (existing) {
      throw new Error('คุณได้โหวตในกิจกรรมนี้ไปแล้ว');
    }

    // [4] ตรวจว่า activity_photo_id อยู่ในกิจกรรมนี้จริง
    const photoInActivity = activity.photos?.find(
      (p: any) => p.activity_photo_id === dto.photo_id
    );
    if (!photoInActivity) {
      throw new Error('รูปภาพนี้ไม่ได้อยู่ในกิจกรรม');
    }

    // [5] บันทึกโหวต
    await this.voteRepo.create({
      activity_id: dto.activity_id,
      photo_id:    dto.photo_id,
      user_id:     userId,
    });
  }

  //@ ดึงผลโหวตของกิจกรรม
  async getResults(activityId: number) {
    return await this.voteRepo.getVoteResults(activityId);
  }

  //@ ดึง vote ของ user ในกิจกรรมที่ระบุ (สำหรับ Frontend แสดงสถานะ "โหวตแล้ว")
  async getUserVotesForActivities(userId: number, activityIds: number[]) {
    return await this.voteRepo.findUserVotesForActivities(userId, activityIds);
  }
}