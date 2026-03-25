import { Request, Response } from "express";
import { EventRepository } from "../repositories/EventRepository";
import { sendError } from "../utils/errorHandler";

const eventRepo = new EventRepository();

export class EventController {
  // ดึงกิจกรรมทั้งหมด
  static async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await eventRepo.findAll();
      res.status(200).json({ success: true, data: events });
    } catch (error: any) {
      sendError(res, error, 'โหลดรายการอีเว้นท์ไม่สำเร็จ');
    }
  }

  // สร้างกิจกรรมใหม่
  static async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const { event_name, event_date } = req.body;
      if (!event_name?.trim()) {
        res.status(400).json({ success: false, message: 'กรุณากรอกชื่ออีเว้นท์' });
        return;
      }
      if (!event_date) {
        res.status(400).json({ success: false, message: 'กรุณาเลือกวันที่จัดอีเว้นท์' });
        return;
      }
      const newEvent = await eventRepo.create({ event_name: event_name.trim(), event_date });
      res.status(201).json({ success: true, data: newEvent });
    } catch (error: any) {
      if (error?.errno === 1062) {
        res.status(400).json({ success: false, message: `ชื่ออีเว้นท์ "${req.body.event_name}" มีอยู่ในระบบแล้ว` });
        return;
      }
      sendError(res, error, 'เพิ่มกิจกรรมไม่สำเร็จ');
    }
  }

  // แก้ไขกิจกรรม (cascade update photos)
  static async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { event_name, event_date } = req.body;
      if (!event_name?.trim()) {
        res.status(400).json({ success: false, message: 'กรุณากรอกชื่ออีเว้นท์' });
        return;
      }
      if (!event_date) {
        res.status(400).json({ success: false, message: 'กรุณาเลือกวันที่จัดกิจกรรม' });
        return;
      }
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID กิจกรรมไม่ถูกต้อง' });
        return;
      }
      const updated = await eventRepo.update(id, { event_name: event_name.trim(), event_date });
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      if (error?.errno === 1062) {
        res.status(400).json({ success: false, message: `ชื่ออีเว้นท์ "${req.body.event_name}" มีอยู่ในระบบแล้ว` });
        return;
      }
      sendError(res, error, 'แก้ไขอีเว้นท์ไม่สำเร็จ');
    }
  }

  // ✅ ลบกิจกรรม (cascade delete photos)
  static async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID กิจกรรมไม่ถูกต้อง' });
        return;
      }
      await eventRepo.delete(id);
      res.status(200).json({ success: true, message: 'ลบกิจกรรมและรูปภาพที่เกี่ยวข้องสำเร็จ' });
    } catch (error: any) {
      sendError(res, error, 'ลบกิจกรรมไม่สำเร็จ');
    }
  }

  // ✅ นับจำนวนรูปที่ผูกกับ event
  static async getPhotoCount(req: Request, res: Response): Promise<void> {
    try {
      const { event_name } = req.query;
      if (!event_name) {
        res.status(400).json({ success: false, message: 'กรุณาระบุชื่ออีเว้นทื' });
        return;
      }
      const count = await eventRepo.countPhotosByEventName(event_name as string);
      res.status(200).json({ success: true, count });
    } catch (error: any) {
      sendError(res, error, 'โหลดจำนวนรูปไม่สำเร็จ');
    }
  }
}