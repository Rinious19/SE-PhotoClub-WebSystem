import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Modal, InputGroup, Row, Col } from 'react-bootstrap';
import { PhotoService } from '../../services/PhotoService';
import { AlertModal } from '../../components/common/AlertModal'; 
import { useAuth } from '@/hooks/useAuth'; 

export const UploadPhotoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  const [formData, setFormData] = useState({
    title: '', 
    event_date: '', // ✅ เพิ่มตัวแปรสำหรับเก็บวันที่
    description: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [events, setEvents] = useState([
    { id: 1, name: 'กิจกรรมรับน้องใหม่' },
    { id: 2, name: 'ออกทริปถ่ายภาพธรรมชาติ' },
    { id: 3, name: 'สอนแต่งภาพ Lightroom พื้นฐาน' },
    { id: 4, name: 'ประกวดภาพถ่ายประจำปี' },
    { id: 5, name: 'กิจกรรมจิตอาสาสร้างฝาย' },
  ]);

  const [modalConfig, setModalConfig] = useState({
    show: false, title: '', message: '', variant: 'primary' as 'success' | 'danger', isSuccess: false
  });

  const [showConfirm, setShowConfirm] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredEvents = events.filter(evt => 
    evt.name.toLowerCase().includes(formData.title.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectEvent = (eventName: string) => {
    setFormData({ ...formData, title: eventName });
    setShowDropdown(false); 
  };

  const isExistingEvent = events.some(e => e.name === formData.title);

  // ✅ เพิ่มเงื่อนไขว่าต้องกรอกวันที่ด้วย ถึงจะกดอัปโหลดได้
  const isFormValid = formData.image_url !== '' && isExistingEvent && formData.event_date !== '';

  const handleCloseModal = () => {
    setModalConfig({ ...modalConfig, show: false });
    if (modalConfig.isSuccess) navigate('/photos');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return; 
    setShowConfirm(true); 
  };

  const confirmUpload = async () => {
    setShowConfirm(false); 
    setSubmitting(true);   
    try {
      const token = localStorage.getItem('token');
      const res = await PhotoService.upload(formData, token!);
      if (res.success) {
        setModalConfig({ show: true, title: 'สำเร็จ!', message: 'อัปโหลดรูปภาพใหม่เรียบร้อยแล้ว', variant: 'success', isSuccess: true });
      }
    } catch (err: any) {
      setModalConfig({ show: true, title: 'เกิดข้อผิดพลาด', message: err.response?.data?.message || 'ไม่สามารถอัปโหลดได้', variant: 'danger', isSuccess: false });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvent = () => alert('ระบบสร้าง Event กำลังอยู่ในช่วงพัฒนาครับ!');

  const handleDeleteEvent = () => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Event "${formData.title}" ทิ้ง?`)) {
      setEvents(events.filter(e => e.name !== formData.title));
      setFormData({ ...formData, title: '' });
      setShowDropdown(false);
    }
  };

  // ✅ ดึงวันที่ปัจจุบันมาเป็นค่าเพื่อกันไม่ให้เลือกวันที่ในอนาคต (รูปแบบ YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Container className="py-5">
      <Card className="shadow-sm border-0 p-4 mx-auto" style={{ maxWidth: '600px' }}>
        <h3 className="fw-bold mb-4">อัปโหลดรูปภาพใหม่</h3>
        
        <Form onSubmit={handleSubmit}>
          
          {/* ✅ ใช้ Row และ Col ของ Bootstrap เพื่อจัดเรียงช่องให้สวยงาม */}
          <Row>
            {/* กล่อง Event */}
            <Col md={12}>
              <Form.Group className="mb-3" ref={dropdownRef}>
                <Form.Label>Event</Form.Label>
                <InputGroup style={{ position: 'relative' }}>
                  <Form.Control 
                    type="text"
                    placeholder="-- พิมพ์เพื่อค้นหา หรือเลือก Event --"
                    value={formData.title} 
                    onChange={e => {
                      setFormData({...formData, title: e.target.value});
                      setShowDropdown(true); 
                    }} 
                    onFocus={() => setShowDropdown(true)} 
                    required
                    style={{ borderColor: (formData.title && !isExistingEvent) ? 'red' : '' }}
                  />
                  
                  <Button variant="outline-secondary" onClick={() => setShowDropdown(!showDropdown)} className="px-3">▼</Button>

                  {user?.role === 'ADMIN' && (
                    <>
                      <Button variant="outline-primary" onClick={handleAddEvent}>+ Add</Button>
                      {isExistingEvent && (
                        <Button variant="outline-danger" onClick={handleDeleteEvent} title="ลบ Event นี้">🗑️</Button>
                      )}
                    </>
                  )}

                  {/* ✅ ย้าย Dropdown เข้ามาอยู่ใน InputGroup เพื่อให้เกาะติดขอบพอดี */}
                  {showDropdown && (
                    <div 
                      className="shadow-sm"
                      style={{
                        position: 'absolute',
                        top: '100%', left: 0, right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '0 0 4px 4px',
                        zIndex: 1050,
                        maxHeight: '170px', 
                        overflowY: 'auto'   
                      }}
                    >
                      {filteredEvents.length > 0 ? (
                        filteredEvents.map((evt) => (
                          <div 
                            key={evt.id}
                            onClick={() => handleSelectEvent(evt.name)}
                            style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f1f1' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {evt.name}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px 15px', color: 'gray', fontStyle: 'italic' }}>ไม่พบ Event ที่ค้นหา</div>
                      )}
                    </div>
                  )}
                </InputGroup>
                
                {formData.title && !isExistingEvent && (
                  <Form.Text className="text-danger mt-1 d-block">กรุณาเลือก Event ที่มีอยู่ในระบบเท่านั้น</Form.Text>
                )}
              </Form.Group>
            </Col>

            {/* ✅ กล่องใส่วันที่ (Date Picker) */}
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>วันที่จัดกิจกรรม</Form.Label>
                <Form.Control 
                  type="date" 
                  value={formData.event_date} 
                  onChange={e => setFormData({...formData, event_date: e.target.value})} 
                  max={today} // ✅ ล็อกไม่ให้เลือกวันที่เกินปัจจุบัน
                  required 
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>คำอธิบาย</Form.Label>
            <Form.Control as="textarea" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>URL รูปภาพ</Form.Label>
            <Form.Control type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} required />
          </Form.Group>

          <div className="d-flex gap-2">
            <Button 
              variant="success" type="submit" disabled={submitting || !isFormValid}
              style={{ opacity: (submitting || !isFormValid) ? 0.4 : 1 }}
            >
              {submitting ? 'กำลังเตรียมข้อมูล...' : 'อัปโหลดรูปภาพ'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/photos')}>ยกเลิก</Button>
          </div>
        </Form>
      </Card>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton><Modal.Title className="text-success fw-bold">ยืนยันการอัปโหลดรูปภาพ</Modal.Title></Modal.Header>
        <Modal.Body className="fs-5 text-center py-4">คุณต้องการอัปโหลดรูปภาพในหมวดหมู่ <b>"{formData.title}"</b> ใช่หรือไม่?</Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
          <Button variant="success" onClick={confirmUpload}>ยืนยันการอัปโหลด</Button>
        </Modal.Footer>
      </Modal>

      <AlertModal show={modalConfig.show} title={modalConfig.title} message={modalConfig.message} variant={modalConfig.variant} onClose={handleCloseModal} />
    </Container>
  );
};