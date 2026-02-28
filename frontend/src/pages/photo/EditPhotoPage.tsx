import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { PhotoService } from '../../services/PhotoService'; // ดึง Service จัดการรูปภาพมาใช้

// ✅ ต้องมีคำว่า export เพื่อให้ AppRouter.tsx สามารถดึงไปใช้งานได้
export const EditPhotoPage: React.FC = () => {
  // ดึง ID จาก URL (เช่น /photos/edit/5 จะได้เลข 5)
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();

  // --- [การจัดการข้อมูลในฟอร์ม] ---
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: ''
  });

  // --- [การจัดการสถานะหน้าจอ] ---
  const [loading, setLoading] = useState(true);      // ใช้ตอนโหลดข้อมูลเดิมมาโชว์
  const [submitting, setSubmitting] = useState(false); // ใช้ตอนกดปุ่มบันทึกเพื่อป้องกันการกดซ้ำ
  const [error, setError] = useState<string | null>(null);

  // --- [ดึงข้อมูลเดิมมาแสดง] ---
  useEffect(() => {
    const loadPhoto = async () => {
      try {
        setLoading(true);
        const res = await PhotoService.getAll(); // ดึงรูปทั้งหมดมาหาใบที่เลือก
        const photo = res.data.find((p: any) => p.id === Number(id));
        
        if (photo) {
          setFormData({
            title: photo.title,
            description: photo.description || '',
            image_url: photo.image_url
          });
        } else {
          setError('ไม่พบข้อมูลรูปภาพนี้');
        }
      } catch (err) {
        setError('โหลดข้อมูลล้มเหลว');
      } finally {
        setLoading(false);
      }
    };
    loadPhoto();
  }, [id]);

  // --- [ฟังก์ชันบันทึกการแก้ไข] ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token'); // ดึง Token ไปยืนยันสิทธิ์ Admin
      const res = await PhotoService.update(Number(id), formData, token!);
      
      if (res.success) {
        alert('แก้ไขข้อมูลสำเร็จ!');
        navigate('/photos'); // แก้เสร็จให้กลับไปหน้าแกลเลอรี่
      }
    } catch (err: any) {
      alert('แก้ไขไม่สำเร็จ: ' + (err.response?.data?.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setSubmitting(false);
    }
  };

  // ถ้ายังโหลดข้อมูลไม่เสร็จ ให้โชว์ตัวหมุน (Spinner)
  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <Container className="py-5">
      <Card className="shadow-sm border-0 p-4 mx-auto" style={{ maxWidth: '600px' }}>
        <h3 className="fw-bold mb-4">แก้ไขข้อมูลรูปภาพ</h3>
        
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* ช่องกรอกชื่อรูป */}
          <Form.Group className="mb-3">
            <Form.Label>ชื่อรูปภาพ</Form.Label>
            <Form.Control 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </Form.Group>

          {/* ช่องกรอกคำอธิบาย */}
          <Form.Group className="mb-3">
            <Form.Label>คำอธิบาย</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </Form.Group>

          {/* ช่องกรอก URL รูปภาพ */}
          <Form.Group className="mb-4">
            <Form.Label>URL รูปภาพ</Form.Label>
            <Form.Control 
              type="text" 
              value={formData.image_url} 
              onChange={e => setFormData({...formData, image_url: e.target.value})} 
              required 
            />
          </Form.Group>

          {/* ปุ่มกด */}
          <div className="d-flex gap-2">
            <Button variant="warning" type="submit" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/photos')}>ยกเลิก</Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};