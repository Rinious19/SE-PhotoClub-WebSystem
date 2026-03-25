//? Controller: Admin
//@ รับ Request จาก Frontend ส่งให้ AdminService และ HistoryService

import type { Response }           from 'express';
import type { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { AdminService }            from '../services/AdminService';
import { HistoryService }          from '../services/HistoryService';
import { UserRole }                from '../enums/UserRole';
import { sendError }               from '../utils/errorHandler';

const adminService   = new AdminService();
const historyService = new HistoryService();

export class AdminController {

  //@ GET /api/admin/users — ดึง User ทั้งหมด
  static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await adminService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      sendError(res, error, 'โหลดข้อมูลผู้ใช้งานไม่สำเร็จ');
    }
  }

  //@ PATCH /api/admin/users/:id/role — เปลี่ยน Role
  static async changeRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const targetUserId = parseInt(req.params.id as string, 10);
      const { role }     = req.body as { role: UserRole };
      const actorId      = req.user?.userId ?? req.user?.id;

      if (isNaN(targetUserId)) {
        res.status(400).json({ success: false, message: 'ID ผู้ใช้ไม่ถูกต้อง' });
        return;
      }

      //! สิ่งที่สำคัญมาก (ตรวจว่า role ที่ส่งมาอยู่ใน enum จริงๆ)
      const validRoles = Object.values(UserRole) as string[];
      if (!role || !validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: `Role ไม่ถูกต้อง — ต้องเป็นหนึ่งใน: ${validRoles.join(', ')}`,
        });
        return;
      }

      await adminService.changeUserRole({ targetUserId, newRole: role, actorId });
      res.status(200).json({ success: true, message: `เปลี่ยน Role เป็น ${role} สำเร็จ` });
    } catch (error: any) {
      sendError(res, error, 'เปลี่ยน Role ไม่สำเร็จ');
    }
  }

  //@ DELETE /api/admin/users/:id — Soft delete User
  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const targetUserId = parseInt(req.params.id as string, 10);
    const actorId      = req.user?.userId ?? req.user?.id;

    if (isNaN(targetUserId)) {
      res.status(400).json({ success: false, message: 'ID ผู้ใช้ไม่ถูกต้อง' });
      return;
    }

    // 🔥 ลบ user ก่อน
    const deletedUser = await adminService.deleteUser({ targetUserId, actorId });

    // ✅ เพิ่ม log ตรงนี้
      await historyService.log({
        actorId,
        action: "DELETE_USER",
        targetType: "USER",
        targetId: targetUserId,
        detail: `ลบบัญชี | userId: ${targetUserId}`,
      });

    res.status(200).json({ success: true, message: 'ลบผู้ใช้งานสำเร็จ' });

  } catch (error: any) {
    sendError(res, error, 'ลบผู้ใช้งานไม่สำเร็จ');
  }
}

  //@ GET /api/admin/history — ดึง History Log
  static async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(50, parseInt(req.query.limit as string) || 20);
      const action = req.query.action as any;
      const type   = req.query.type   as any;

      const result = await historyService.getHistory({ page, limit, action, type });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page, limit,
          total:      result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error: any) {
      sendError(res, error, 'โหลด History ไม่สำเร็จ');
    }
  }
}