import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { PhotoCard } from '../../components/photo/PhotoCard';
import { PhotoService } from '../../services/PhotoService';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // ✅ [1] นำเข้า useAuth เพื่อใช้เช็คข้อมูลผู้ใช้ที่ล็อกอินอยู่

export const PhotoListPage: React.FC = () => {
  // --- [การจัดการ State] ---
  const [photos, setPhotos] = useState<any[]>([]);       // เก็บรายการรูปภาพ
  const [loading, setLoading] = useState<boolean>(true); // สถานะการโหลดข้อมูล
  const [error, setError] = useState<string | null>(null); // เก็บข้อความ Error

  // --- [การจัดการสิทธิ์การใช้งาน] ---
  const { user } = useAuth(); // ✅ [2] ดึงข้อมูล user มาจากระบบ Auth
  
  // ✅ [3] ตรวจสอบสิทธิ์: ต้องเป็น ADMIN หรือ CLUB_PRESIDENT เท่านั้นถึงจะเห็นปุ่มอัปโหลด
  // ถ้าเป็น GUEST หรือ EXTERNAL_USER ค่านี้จะเป็น false
  const canUpload = user?.role === 'ADMIN' || user?.role === 'CLUB_PRESIDENT';

  // --- [การดึงข้อมูลจาก API] ---
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await PhotoService.getAll(); // เรียกใช้ Service ดึงรูปภาพ
        if (response.success) {
          setPhotos(response.data);
        } else {
          setError('ไม่สามารถดึงข้อมูลรูปภาพได้');
        }
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  return (
    <Container className="py-5">
      
      {/* ส่วนหัวข้อและปุ่มอัปโหลด */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">
          แกลเลอรี 
          {/* ✅ แก้ไขจุดนี้: ใช้ canUpload ครอบส่วนตัวเลขไว้ */}
          {canUpload && (
            <span className="text-secondary fs-5 fw-normal ml-2">
              ({photos.length})
            </span>
          )}
        </h2>

        {/* ✅ [4] การเช็คเงื่อนไข: แสดงปุ่มเฉพาะผู้ที่มีสิทธิ์เท่านั้น */}
        {canUpload && (
          <Link to="/photos/upload" className="btn btn-success px-4 fw-bold shadow-sm">
            + อัปโหลดรูปภาพ
          </Link>
        )}
      </div>

      {/* --- [ส่วนการแสดงผลเนื้อหา] --- */}
      {loading ? (
        // แสดงตัวหมุนขณะโหลดข้อมูล
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        // แสดงข้อความเตือนเมื่อเกิด Error
        <Alert variant="danger">
          {error}
        </Alert>
      ) : photos.length === 0 ? (
        // แสดงข้อความเมื่อไม่มีรูปภาพในระบบเลย
        <div className="text-center text-secondary py-5">
          <h5>ยังไม่มีรูปภาพในระบบ</h5>
          <p>รอผู้ใช้อัปโหลดรูปภาพใหม่เร็วๆ นี้</p>
        </div>
      ) : (
        // แสดงรายการรูปภาพในรูปแบบ Grid
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {photos.map((photo) => (
            <Col key={photo.id}>
              {/* ส่งข้อมูล photo ไปยัง PhotoCard เพื่อเรนเดอร์รายใบ */}
              <PhotoCard photo={photo} />
            </Col>
          ))}
        </Row>
      )}

    </Container>
  );
};