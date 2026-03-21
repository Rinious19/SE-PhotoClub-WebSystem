import { HistoryRepository } from '../repositories/HistoryRepository';

export class HistoryService {
  private repo = new HistoryRepository();

  async log(userId: number, action: string, targetType: string, targetId?: number) {
    return this.repo.create({
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId
    });
  }

  async getAll() {
    return this.repo.findAll();
  }
}