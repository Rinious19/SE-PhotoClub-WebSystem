//? Service: Photo Service
//@ Business Logic สำหรับจัดการรูปภาพ

import { PhotoRepository } from '../repositories/PhotoRepository';
import { historyService } from './HistoryService';
import type { Photo } from '../models/Photo';

const photoRepository = new PhotoRepository();

export class PhotoService {

  //@ อัปโหลดรูปภาพใหม่ พร้อมบันทึก Log
  async createPhoto(actorId: number, data: Photo) {
    const photo = await photoRepository.create(data);

    await historyService.log({
      actorId,
      action:     'UPLOAD_PHOTO',
      targetType: 'PHOTO',
      targetId:   photo.id,
      detail: {
        title:     data.title,
        eventName: data.title ?? null,
      },
    });

    return photo;
  }

  //@ ลบรูปภาพ พร้อมบันทึก Log
  async deletePhoto(actorId: number, photoId: number) {
    //! สิ่งที่สำคัญมาก (ดึงข้อมูลก่อนลบ เพื่อเก็บ title ไว้ใน log)
    const photo = await photoRepository.findById(photoId);

    await photoRepository.hardDelete(photoId);  // ← ใช้ hardDelete ตาม Repository จริง

    await historyService.log({
      actorId,
      action:     'DELETE_PHOTO',
      targetType: 'PHOTO',
      targetId:   photoId,
      detail: {
        deletedTitle: photo?.title ?? 'unknown',
      },
    });
  }

  //@ ดึงรูปทั้งหมด
  async getAllPhotos() {
    return photoRepository.findAllActive();  // ← ใช้ findAllActive ตาม Repository จริง
  }

  //@ ดึงรูปตาม ID
  async getPhotoById(photoId: number) {
    return photoRepository.findById(photoId);
  }
}

export const photoService = new PhotoService();