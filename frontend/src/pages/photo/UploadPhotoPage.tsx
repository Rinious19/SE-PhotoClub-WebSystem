import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PhotoService } from '../../services/PhotoService';
import { EventService } from '../../services/EventService'; 
import { AlertModal } from '../../components/common/AlertModal';
import { useAuth } from '@/hooks/useAuth';

export const UploadPhotoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- [States หลัก] ---
  const [events, setEvents] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', event_date: '', description: '' });

  // --- [States สำหรับ UI & Modal] ---
  const [loading, setLoading] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({ name: '', date: '' });
  const [modalConfig, setModalConfig] = useState({ show: false, title: '', message: '', variant: 'success' as 'success' | 'danger', isSuccess: false });

  // --- [1. Load Events จาก Database] ---
  const loadEvents = async () => {
    try {
      const res = await EventService.getAll();
      setEvents(res.data || []);
    } catch (err) { console.error("Failed to load events"); }
  };

  useEffect(() => { loadEvents(); }, []);

  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- [2. Search Logic] ---
  const filteredEvents = useMemo(() => {
    return events.filter(ev => ev.event_name.toLowerCase().includes(formData.title.toLowerCase()));
  }, [events, formData.title]);

  const isValidEvent = events.some(ev => ev.event_name === formData.title);

  // --- [3. ฟังก์ชันสร้าง Event ใหม่ลง Database] ---
  const handleCreateEvent = async () => {
    if (!newEventData.name || !newEventData.date) {
      alert("กรุณากรอกข้อมูลกิจกรรมให้ครบถ้วน");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await EventService.create({ 
        event_name: newEventData.name, 
        event_date: newEventData.date 
      }, token!);

      if (res.success) {
        // อัปเดตรายการในหน้าจอทันที
        await loadEvents();
        // เลือกกิจกรรมที่เพิ่งสร้างให้เลย
        setFormData({ ...formData, title: newEventData.name, event_date: newEventData.date });
        setShowAddEventModal(false);
        setNewEventData({ name: '', date: '' });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "ไม่สามารถสร้างกิจกรรมได้ (ชื่ออาจซ้ำ)");
    }
  };

  // --- [4. ฟังก์ชันอัปโหลดรูปภาพ] ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !isValidEvent) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('image', selectedFile);
      data.append('title', formData.title);
      data.append('event_date', formData.event_date);
      data.append('description', formData.description);

      const res = await PhotoService.upload(data, token!);
      if (res.success) {
        setModalConfig({ show: true, title: 'สำเร็จ!', message: 'อัปโหลดรูปภาพเรียบร้อย', variant: 'success', isSuccess: true });
      }
    } catch (err: any) {
      setModalConfig({ show: true, title: 'ผิดพลาด', message: 'อัปโหลดไม่สำเร็จ', variant: 'danger', isSuccess: false });
    } finally { setLoading(false); }
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm border-0 p-4 mx-auto" style={{ maxWidth: '900px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">📸 อัปโหลดรูปภาพใหม่</h3>
          {user?.role === 'ADMIN' && (
            <Button variant="primary" size="sm" onClick={() => setShowAddEventModal(true)}>+ สร้างกิจกรรมใหม่</Button>
          )}
        </div>

        <Form onSubmit={handleUpload}>
          <Row>
            <Col md={5} className="text-center mb-4">
              <div className="border rounded p-3 bg-light d-flex align-items-center justify-content-center" 
                   style={{ minHeight: '300px', cursor: 'pointer' }} 
                   onClick={() => document.getElementById('fileInput')?.click()}>
                {previewUrl ? <img src={previewUrl} className="img-fluid rounded" style={{ maxHeight: '350px' }} alt="preview" /> : 
                <div className="text-secondary"><i className="bi bi-image fs-1 d-block"></i>คลิกเพื่อเลือกรูปภาพ</div>}
              </div>
              <Form.Control id="fileInput" type="file" accept="image/*" hidden onChange={(e: any) => {
                const file = e.target.files[0];
                if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
              }} />
            </Col>

            <Col md={7}>
              <Form.Group className="mb-3 position-relative" ref={dropdownRef}>
                <Form.Label className="fw-bold">เลือกกิจกรรม (Event)</Form.Label>
                <div className="input-group">
                  <Form.Control type="text" placeholder="ค้นหาชื่อกิจกรรม..." value={formData.title}
                    onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setIsDropdownOpen(true); }}
                    onFocus={() => setIsDropdownOpen(true)} required
                  />
                  <Button variant="outline-secondary" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>{isDropdownOpen ? '▲' : '▼'}</Button>
                </div>

                {isDropdownOpen && filteredEvents.length > 0 && (
                  <div className="position-absolute w-100 shadow-lg border rounded bg-white mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredEvents.map((ev, index) => (
                      <div key={index} className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }}
                        onClick={() => { setFormData({ ...formData, title: ev.event_name, event_date: ev.event_date.split('T')[0] }); setIsDropdownOpen(false); }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                      >
                        <span className="fw-bold text-primary">{ev.event_name}</span>
                        <span className="text-muted small">{ev.event_date.split('T')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!isValidEvent && formData.title !== "" && <Form.Text className="text-danger">* โปรดเลือกจากกิจกรรมที่มีอยู่ในฐานข้อมูล</Form.Text>}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-secondary">วันที่จัดกิจกรรม (ล็อกตามระบบ)</Form.Label>
                <Form.Control type="date" value={formData.event_date} readOnly className="bg-light" tabIndex={-1} />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">คำอธิบายรูปภาพ</Form.Label>
                <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button variant="success" type="submit" className="fw-bold py-2" disabled={loading || !selectedFile || !isValidEvent}>
                  {loading ? "กำลังอัปโหลด..." : "🚀 อัปโหลดรูปลงระบบ"}
                </Button>
                <Button variant="light" onClick={() => navigate('/photos')}>ยกเลิก</Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* --- [Modal สร้าง Event ใหม่ลงฐานข้อมูล] --- */}
      <Modal show={showAddEventModal} onHide={() => setShowAddEventModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold text-primary">เพิ่มกิจกรรมใหม่ในระบบ</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>ชื่อกิจกรรม</Form.Label>
            <Form.Control type="text" placeholder="เช่น ทริปถ่ายนกเขาใหญ่" value={newEventData.name} onChange={(e) => setNewEventData({...newEventData, name: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>วันที่จัดกิจกรรม</Form.Label>
            <Form.Control type="date" value={newEventData.date} onChange={(e) => setNewEventData({...newEventData, date: e.target.value})} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddEventModal(false)}>ยกเลิก</Button>
          <Button variant="primary" onClick={handleCreateEvent}>บันทึกลงฐานข้อมูล</Button>
        </Modal.Footer>
      </Modal>

      <AlertModal show={modalConfig.show} title={modalConfig.title} message={modalConfig.message} variant={modalConfig.variant}
        onClose={() => { setModalConfig({ ...modalConfig, show: false }); if (modalConfig.isSuccess) navigate('/photos'); }} />
    </Container>
  );
};