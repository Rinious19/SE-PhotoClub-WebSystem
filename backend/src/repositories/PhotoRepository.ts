// backend/src/repositories/PhotoRepository.ts

import { pool } from '../config/Database';
import type { Photo } from '../models/Photo';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface PhotoRow extends RowDataPacket, Photo {}

export class PhotoRepository {
  async create(photo: Photo): Promise<Photo> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO photos (title, description, image_url, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      // ✅ จุดที่แก้ไข: เพิ่ม || null ต่อท้าย photo.description
      [photo.title, photo.description || null, photo.image_url, photo.user_id]
    );
    
    return { ...photo, id: result.insertId };
  }
  // ฟังก์ชันลบรูปภาพจากฐานข้อมูล
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM photos WHERE id = ?',
      [id]
    );
    // ถ้า affectedRows > 0 แปลว่าลบสำเร็จ
    return result.affectedRows > 0;
  }

  async update(id: number, photo: Partial<Photo>): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE photos SET title = ?, description = ?, image_url = ?, updated_at = NOW() WHERE id = ?',
      [photo.title ?? null, photo.description ?? null, photo.image_url ?? null, id]
    );
    return result.affectedRows > 0;
  }

  async findAll(): Promise<Photo[]> {
    const [rows] = await pool.execute<PhotoRow[]>(
      'SELECT * FROM photos ORDER BY created_at DESC'
    );
    return rows;
  }
}