import React from 'react';
import { Modal, Button } from 'react-bootstrap';

// กำหนดว่า Modal นี้รับค่าอะไรบ้าง
interface AlertModalProps {
  show: boolean;         // สั่งให้แสดงหรือซ่อน
  title: string;         // หัวข้อ Modal
  message: string;       // ข้อความแจ้งเตือน
  variant?: 'success' | 'danger' | 'warning' | 'info'; // สีของปุ่ม/ไอคอน (ถ้ามี)
  onClose: () => void;   // ฟังก์ชันเมื่อกดปิด
}

export const AlertModal: React.FC<AlertModalProps> = ({ 
  show, title, message, variant = 'primary', onClose 
}) => {
  return (
    // centered ทำให้ Modal อยู่ตรงกลางหน้าจอเสมอ
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className={`text-${variant} fw-bold`}>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="fs-5 text-center py-4">
        {message}
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        <Button variant={variant} onClick={onClose} className="px-4">
          ตกลง
        </Button>
      </Modal.Footer>
    </Modal>
  );
};