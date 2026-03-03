import React, { useState } from 'react'; 
import { Card, Button, Modal } from 'react-bootstrap'; 
import { PhotoService } from '../../services/PhotoService';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AlertModal } from '../common/AlertModal'; 

interface PhotoCardProps {
  photo: { id: number; title: string; description?: string; image_url: string; };
  onPhotoDeleted?: () => void; 
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onPhotoDeleted }) => {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'CLUB_PRESIDENT';

  // --- [1. State ควบคุม AlertModal (แจ้งลบสำเร็จ/ล้มเหลว)] ---
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    variant: 'primary' as 'success' | 'danger',
    isSuccess: false
  });

  const handleCloseAlertModal = () => {
    setModalConfig({ ...modalConfig, show: false });
    if (modalConfig.isSuccess) {
      if (onPhotoDeleted) onPhotoDeleted(); 
      else window.location.reload(); 
    }
  };

  // --- [2. State ควบคุม Lightbox Modal (ขยายรูป)] ---
  const [showLightbox, setShowLightbox] = useState(false); 
  const handleOpenLightbox = () => setShowLightbox(true);      
  const handleCloseLightbox = () => setShowLightbox(false);    

  // --- [3. ✅ State ควบคุม Confirm Modal (ถามก่อนลบ)] ---
  const [showConfirm, setShowConfirm] = useState(false);
  const handleOpenConfirm = () => setShowConfirm(true);
  const handleCloseConfirm = () => setShowConfirm(false);

  // --- [4. ฟังก์ชันลบรูปภาพ (ถูกเรียกใช้เมื่อกดยืนยันใน Modal)] ---
  const confirmDelete = async () => {
    handleCloseConfirm(); // ปิดหน้าต่างถามความแน่ใจก่อน
    
    try {
      const token = localStorage.getItem('token');
      const res = await PhotoService.delete(photo.id, token!);
      
      if (res.success) {
        setModalConfig({
          show: true,
          title: 'ลบสำเร็จ!',
          message: 'รูปภาพถูกย้ายลงถังขยะเรียบร้อยแล้ว',
          variant: 'success',
          isSuccess: true
        });
      }
    } catch (err: any) {
      setModalConfig({
        show: true,
        title: 'เกิดข้อผิดพลาด',
        message: err.response?.data?.message || 'ไม่สามารถลบรูปภาพได้',
        variant: 'danger',
        isSuccess: false
      });
    }
  };

  return (
    <>
      <Card className="h-100 border-0 shadow-sm overflow-hidden">
        <div 
          onClick={handleOpenLightbox} 
          style={{ cursor: 'pointer', overflow: 'hidden' }}
          title="คลิกเพื่อดูภาพขนาดใหญ่"
        >
          <Card.Img 
            variant="top" 
            src={photo.image_url} 
            style={{ height: '250px', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
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
              {/* ✅ เปลี่ยน onClick ให้มาเปิดหน้าต่าง Confirm แทน */}
              <Button variant="outline-danger" size="sm" className="flex-fill" onClick={handleOpenConfirm}>
                ลบ
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* 🔴 ส่วนที่ 2: Lightbox Modal (ขยายรูป) */}
      <Modal show={showLightbox} onHide={handleCloseLightbox} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{photo.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          <img src={photo.image_url} alt={photo.title} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          <div className="p-4 bg-light text-start">
            <h5 className="fw-bold">รายละเอียดภาพ</h5>
            <p className="text-secondary mb-0">{photo.description || 'ไม่มีคำอธิบายสำหรับภาพนี้'}</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleCloseLightbox}>ปิดหน้าต่าง</Button>
        </Modal.Footer>
      </Modal>

      {/* 🔴 ✅ ส่วนที่ 3: Confirm Modal (หน้าต่างถามความแน่ใจสวยๆ) */}
      <Modal show={showConfirm} onHide={handleCloseConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold">ยืนยันการลบรูปภาพ</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fs-5 text-center py-4">
          คุณแน่ใจหรือไม่ว่าต้องการย้ายรูปภาพ <b>"{photo.title}"</b> ลงถังขยะ?
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" onClick={handleCloseConfirm} className="px-4">
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="px-4">
            ยืนยันการลบ
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🔴 ส่วนที่ 4: AlertModal (แจ้งผลลัพธ์) */}
      <AlertModal 
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        onClose={handleCloseAlertModal}
      />
    </>
  );
};