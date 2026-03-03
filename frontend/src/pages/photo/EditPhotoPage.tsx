import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Row, Col, Spinner, Alert, Modal } from 'react-bootstrap';
import { PhotoService } from "../../services/PhotoService";
import { EventService } from "../../services/EventService"; // 🌟 ต้องมี Service นี้
import { AlertModal } from "../../components/common/AlertModal";

export const EditPhotoPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- [States] ---
  const [events, setEvents] = useState<any[]>([]); // เก็บข้อมูลกิจกรรมจากฐานข้อมูล
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    image_url: null as any,
  });

  const [originalData, setOriginalData] = useState({ ...formData });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [modalConfig, setModalConfig] = useState({ 
    show: false, title: "", message: "", variant: "primary" as "success" | "danger", isSuccess: false 
  });
  const [showConfirm, setShowConfirm] = useState(false);

  // --- [1. Load Data จาก Database] ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 🌟 ดึงข้อมูลจากตาราง Events โดยตรง
        const eventRes = await EventService.getAll();
        setEvents(eventRes.data);

        // ดึงข้อมูลรูปภาพที่จะแก้ไข
        const photoRes = await PhotoService.getAll();
        const photo = photoRes.data.find((p: any) => p.id === Number(id));

        if (photo) {
          const initData = {
            title: photo.title,
            description: photo.description || "",
            event_date: photo.event_date ? photo.event_date.split('T')[0] : "",
            image_url: photo.image_url,
          };
          setFormData(initData);
          setOriginalData(initData);
        } else {
          setError("ไม่พบข้อมูลรูปภาพนี้");
        }
      } catch (err) {
        setError("โหลดข้อมูลล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- [2. Search & Preview Logic] ---
  
  // กรอง Event ตามที่พิมพ์ค้นหา
  const filteredEvents = useMemo(() => {
    return events.filter(ev => 
      ev.event_name.toLowerCase().includes(formData.title.toLowerCase())
    );
  }, [events, formData.title]);

  const previewImage = useMemo(() => {
    if (selectedFile) return URL.createObjectURL(selectedFile);
    if (!formData.image_url) return 'https://via.placeholder.com/400x300?text=No+Image';
    try {
      const uint8Array = new Uint8Array(formData.image_url.data || formData.image_url);
      return URL.createObjectURL(new Blob([uint8Array], { type: 'image/jpeg' }));
    } catch (e) { return ''; }
  }, [selectedFile, formData.image_url]);

  // ตรวจสอบว่าชื่อ Event ตรงกับที่มีในฐานข้อมูลหรือไม่
  const isValidEvent = events.some(ev => ev.event_name === formData.title);

  const hasChanges = 
    formData.title !== originalData.title || 
    formData.description !== originalData.description || 
    selectedFile !== null;

  // --- [3. Actions] ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || !isValidEvent) return;
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('event_date', formData.event_date);
      data.append('description', formData.description);
      if (selectedFile) data.append('image', selectedFile);

      const res = await PhotoService.update(Number(id), data, localStorage.getItem("token")!);
      
      if (res.success) {
        setModalConfig({ 
          show: true, title: "สำเร็จ!", message: "แก้ไขข้อมูลเรียบร้อยแล้ว", 
          variant: "success", isSuccess: true 
        });
      }
    } catch (err) {
      setModalConfig({ 
        show: true, title: "ผิดพลาด", message: "แก้ไขล้มเหลว", 
        variant: "danger", isSuccess: false 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <Container className="py-5">
      <Card className="shadow-sm border-0 p-4 mx-auto" style={{ maxWidth: "900px" }}>
        <h3 className="fw-bold mb-4">แก้ไขข้อมูลรูปภาพ</h3>
        
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            {/* ซ้าย: รูปภาพ */}
            <Col md={5} className="text-center mb-4">
              <div className="border rounded p-2 bg-light shadow-sm">
                <img src={previewImage} className="img-fluid rounded" style={{ maxHeight: '350px' }} alt="preview" />
              </div>
              <Form.Group className="mt-3">
                <Form.Label className="btn btn-primary w-100 fw-bold">
                  📷 เปลี่ยนรูปภาพใหม่
                  <Form.Control type="file" hidden onChange={(e: any) => setSelectedFile(e.target.files[0])} />
                </Form.Label>
              </Form.Group>
            </Col>

            {/* ขวา: ข้อมูลฟอร์ม */}
            <Col md={7}>
              <Form.Group className="mb-3 position-relative" ref={dropdownRef}>
                <Form.Label className="fw-bold">เลือกกิจกรรม (Event)</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="พิมพ์ชื่อกิจกรรมเพื่อค้นหา..."
                    value={formData.title}
                    onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                  />
                  <Button variant="outline-secondary" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    {isDropdownOpen ? '▲' : '▼'}
                  </Button>
                </div>

                {/* Dropdown กิจกรรมจากฐานข้อมูล */}
                {isDropdownOpen && filteredEvents.length > 0 && (
                  <div className="position-absolute w-100 shadow-lg border rounded bg-white mt-1" 
                       style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredEvents.map((ev, index) => (
                      <div key={index} className="p-3 border-bottom d-flex justify-content-between align-items-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setFormData({ 
                            ...formData, 
                            title: ev.event_name, 
                            event_date: ev.event_date.split('T')[0] 
                          });
                          setIsDropdownOpen(false);
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                      >
                        <span className="fw-bold text-primary">{ev.event_name}</span>
                        <span className="text-muted small">{ev.event_date.split('T')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!isValidEvent && formData.title !== "" && (
                  <Form.Text className="text-danger">* โปรดเลือกกิจกรรมที่ถูกต้องจากตารางฐานข้อมูล</Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-secondary small">วันที่จัดกิจกรรม (ล็อกตามระบบ)</Form.Label>
                <Form.Control type="date" value={formData.event_date} readOnly className="bg-light" tabIndex={-1} />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">คำอธิบายเพิ่มเติม</Form.Label>
                <Form.Control as="textarea" rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button 
                  variant="warning" type="submit" className="fw-bold py-2" 
                  disabled={submitting || !hasChanges || !isValidEvent} 
                  style={{ opacity: submitting || !hasChanges || !isValidEvent ? 0.5 : 1 }}
                >
                  {submitting ? "กำลังบันทึก..." : "💾 บันทึกการแก้ไข"}
                </Button>
                <Button variant="light" onClick={() => navigate("/photos")}>ยกเลิก</Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Confirm Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton><Modal.Title className="text-warning fw-bold">ยืนยันการแก้ไข</Modal.Title></Modal.Header>
        <Modal.Body className="text-center py-4 fs-5">ต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่?</Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
          <Button variant="warning" onClick={confirmSave}>ยืนยันการบันทึก</Button>
        </Modal.Footer>
      </Modal>

      {/* Alert Result Modal */}
      <AlertModal 
        show={modalConfig.show} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        variant={modalConfig.variant} 
        onClose={() => { 
          setModalConfig({ ...modalConfig, show: false }); 
          if (modalConfig.isSuccess) navigate("/photos"); 
        }} 
      />
    </Container>
  );
};