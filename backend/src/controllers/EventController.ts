import { Request, Response } from "express";
import { EventRepository } from "../repositories/EventRepository";

const eventRepo = new EventRepository();

export class EventController {
  // ดึงกิจกรรมทั้งหมด
  static async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await eventRepo.findAll();
      res.status(200).json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // สร้างกิจกรรมใหม่
  static async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const { event_name, event_date } = req.body;
      if (!event_name || !event_date) {
        res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบ" });
        return;
      }
      const newEvent = await eventRepo.create({ event_name, event_date });
      res.status(201).json({ success: true, data: newEvent });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "อาจมีชื่อกิจกรรมนี้อยู่แล้ว" });
    }
  }

  // แก้ไขกิจกรรม (cascade update photos)
  static async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { event_name, event_date } = req.body;
      if (!event_name || !event_date) {
        res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบ" });
        return;
      }
      const updated = await eventRepo.update(Number(id), { event_name, event_date });
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ ลบกิจกรรม (cascade delete photos)
  static async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await eventRepo.delete(Number(id));
      res.status(200).json({ success: true, message: "ลบกิจกรรมและรูปภาพที่เกี่ยวข้องสำเร็จ" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ นับจำนวนรูปที่ผูกกับ event (ใช้แสดงใน confirm modal)
  static async getPhotoCount(req: Request, res: Response): Promise<void> {
    try {
      const { event_name } = req.query;
      if (!event_name) {
        res.status(400).json({ success: false, message: "กรุณาระบุชื่อกิจกรรม" });
        return;
      }
      const count = await eventRepo.countPhotosByEventName(event_name as string);
      res.status(200).json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}