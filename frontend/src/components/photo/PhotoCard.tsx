import React, { useState } from 'react'; // ✅ เพิ่ม useState เข้ามา
import { Card, Button, Modal } from 'react-bootstrap'; // ✅ เพิ่ม Modal จาก react-bootstrap
import { PhotoService } from '../../services/PhotoService';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface PhotoCardProps {
  photo: { id: number; title: string; description?: string; image_url: string; };
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo }) => {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'CLUB_PRESIDENT';

  // --- [1. การจัดการสถานะ Modal (ป๊อปอัปขยายรูป)] ---
  const [showModal, setShowModal] = useState(false); // ค่าเริ่มต้นเป็น false (ซ่อนอยู่)
  const handleOpen = () => setShowModal(true);      // ฟังก์ชันสำหรับเปิด
  const handleClose = () => setShowModal(false);    // ฟังก์ชันสำหรับปิด

  // ฟังก์ชันลบรูป (เหมือนเดิม)
  const handleDelete = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await PhotoService.delete(photo.id, token!);
        if (res.success) window.location.reload();
      } catch (error: any) {
        alert('ลบไม่สำเร็จ: ' + (error.response?.data?.message || 'สิทธิ์ไม่พอ'));
      }
    }
  };

  return (
    <>
      <Card className="h-100 border-0 shadow-sm overflow-hidden">
        {/* ✅ [2. ส่วนรูปภาพ: เพิ่ม cursor: pointer และ onClick เพื่อให้กดได้] */}
        <div 
          onClick={handleOpen} 
          style={{ cursor: 'pointer', overflow: 'hidden' }}
          title="คลิกเพื่อดูภาพขนาดใหญ่"
        >
          <Card.Img 
            variant="top" 
            src={photo.image_url} 
            style={{ 
              height: '250px', 
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }} 
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
        
        <Card.Body className="d-flex flex-column">
          <Card.Title className="fw-bold text-dark">{photo.title}</Card.Title>
          <Card.Text className="small text-muted text-truncate">{photo.description}</Card.Text>

          {canManage && (
            <div className="d-flex gap-2 mt-auto pt-3">
              <Link to={`/photos/edit/${photo.id}`} className="btn btn-outline-warning btn-sm flex-fill">
                แก้ไข
              </Link>
              <Button variant="outline-danger" size="sm" className="flex-fill" onClick={handleDelete}>
                ลบ
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* --- [3. ส่วนของ Modal (หน้าต่างป๊อปอัปที่เด้งขึ้นมา)] --- */}
      <Modal show={showModal} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{photo.title}</Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="text-center p-0">
          <img 
            src={photo.image_url} 
            alt={photo.title} 
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
          />
          {/* แสดงคำอธิบายภาพใน Modal */}
          <div className="p-4 bg-light text-start">
            <h5 className="fw-bold">รายละเอียดภาพ</h5>
            <p className="text-secondary mb-0">
              {photo.description || 'ไม่มีคำอธิบายสำหรับภาพนี้'}
            </p>
          </div>
        </Modal.Body>
        
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleClose}>
            ปิดหน้าต่าง
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};