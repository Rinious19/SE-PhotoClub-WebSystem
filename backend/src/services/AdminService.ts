import { pool } from '../config/Database';
import { HistoryService } from './HistoryService';

export class AdminService {
  private historyService = new HistoryService();

  async getAllUsers() {
    const [rows] = await pool.execute('SELECT * FROM users');
    return rows;
  }

  async changeRole(adminId: number, userId: number, newRole: string) {
    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [newRole, userId]
    );

    await this.historyService.log(
      adminId,
      'CHANGE_ROLE',
      'USER',
      userId
    );

    return { success: true };
  }
}