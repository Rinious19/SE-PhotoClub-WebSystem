import { Request, Response } from "express";
import { EventRepository } from "../repositories/EventRepository";

const eventRepo = new EventRepository();

export class EventController {
  // ดึงกิจกรรมทั้งหมดส่งไปหน้าบ้าน
  static async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await eventRepo.findAll();
      res.status(200).json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // บันทึกกิจกรรมใหม่ (จากปุ่ม + Add)
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
}