// backend/src/services/PhotoService.ts
//? Service: Photo Logic
//@ จัดการ Business Logic ของรูปภาพก่อนส่งไปที่ Repository

import { PhotoRepository } from '../repositories/PhotoRepository';
import type { Photo } from '../models/Photo';

const photoRepo = new PhotoRepository();

export class PhotoService {
  static async upload(photoData: Photo): Promise<Photo> {
    // สามารถเพิ่ม Logic เช็คขนาดไฟล์ หรือ เช็คคำหยาบใน description ได้ที่นี่
    return await photoRepo.create(photoData);
  }

  static async getAllPhotos(): Promise<Photo[]> {
    return await photoRepo.findAll();
  }

  static async deletePhoto(id: number): Promise<boolean> {
    return await photoRepo.delete(id);
  }
}