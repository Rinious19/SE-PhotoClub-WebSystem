//? Service: History Service
//@ Business Logic สำหรับบันทึกและดึง History Log
//  ทำหน้าที่เป็น "central logging" ให้ Service อื่นๆ เรียกใช้ได้

import { HistoryRepository } from '../repositories/HistoryRepository';
import type { HistoryAction, HistoryTargetType } from '../models/HistoryLog';

//! สิ่งที่สำคัญมาก (ใช้ Singleton pattern — สร้าง instance เดียวแชร์ทั่วแอป)
const historyRepository = new HistoryRepository();

export class HistoryService {

  //@ เรียกใช้ง่ายๆ จาก Service อื่น เช่น AdminService.changeRole() → HistoryService.log(...)
  async log(params: {
    actorId:    number | null;
    action:     HistoryAction;
    targetType: HistoryTargetType;
    targetId?:  number | null;
    detail?:    object | string | null;
  }): Promise<void> {
    //* context (แปลง detail object → JSON string ก่อนบันทึก)
    const detailStr =
      params.detail
        ? typeof params.detail === 'string'
          ? params.detail
          : JSON.stringify(params.detail)
        : null;

    await historyRepository.create({
      actor_id:    params.actorId,
      action:      params.action,
      target_type: params.targetType,
      target_id:   params.targetId ?? null,
      detail:      detailStr,
    });
  }

  //@ ดึง history พร้อม pagination สำหรับ HistoryPage
  async getHistory(options: {
    page?:   number;
    limit?:  number;
    action?: HistoryAction;
    type?:   HistoryTargetType;
  } = {}) {
    return historyRepository.findAll({
      page:       options.page,
      limit:      options.limit,
      action:     options.action,
      targetType: options.type,
    });
  }
}