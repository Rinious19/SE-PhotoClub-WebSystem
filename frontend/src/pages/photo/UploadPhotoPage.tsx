import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoService } from '../../services/PhotoService';

export const UploadPhotoPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ดึง token จาก localStorage (สมมติว่าคุณเก็บ token ไว้ที่นี่ตอน Login)
      const token = localStorage.getItem('token'); 
      if (!token) {
        alert('ไม่พบ Token กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await PhotoService.upload(
        { title, description, image_url: imageUrl },
        token
      );

      if (response.success) {
        alert('อัปโหลดสำเร็จ!');
        navigate('/photos'); // เด้งกลับไปหน้าแกลเลอรี
      } else {
        alert('อัปโหลดล้มเหลว: ' + response.message);
      }
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="container py-5">
      <h2>อัปโหลดรูปภาพ</h2>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label>ชื่อรูปภาพ (Title)</label>
          <input type="text" className="form-control" required value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="mb-3">
          <label>คำอธิบาย (Description)</label>
          <textarea className="form-control" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="mb-3">
          <label>URL รูปภาพ (Image URL)</label>
          <input type="text" className="form-control" required value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/photos')}>ยกเลิก</button>
      </form>
    </div>
  );
};