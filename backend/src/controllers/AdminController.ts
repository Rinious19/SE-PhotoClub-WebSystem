import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';

export class AdminController {
  private service = new AdminService();

  getUsers = async (req: Request, res: Response) => {
    const users = await this.service.getAllUsers();
    res.json(users);
  };

  changeRole = async (req: Request, res: Response) => {
    const adminId = (req as any).user.id;
    const { userId, role } = req.body;

    const result = await this.service.changeRole(adminId, userId, role);
    res.json(result);
  };
}