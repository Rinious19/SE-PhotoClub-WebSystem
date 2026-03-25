//? Page: Edit Activity Page
//@ หน้าแก้ไขกิจกรรมโหวต — เฉพาะ ADMIN และ CLUB_PRESIDENT
//  - ADMIN → ปรับเวลา/ชื่อ/ประเภทได้
//  - ไม่สามารถเปลี่ยนอีเว้นท์ต้นทางได้ (ต้องสร้างใหม่แทน)

import React, { useState, useEffect } from 'react';
import {
  Container, Card, Form, Button, Row, Col,
  Spinner, Alert, Modal,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { ActivityService }         from '@/services/ActivityService';
import { parseApiError }           from '@/utils/apiError';

//@ กำหนด type ของ Activity ที่โหลดมาแก้ไข
interface ActivityForEdit {
  id:           number;
  title:        string;
  description?: string;
  category?:    string;
  event_name:   string;
  start_at:     string;
  end_at:       string;
  status:       'UPCOMING' | 'ACTIVE' | 'ENDED';
}

//@ แปลง ISO string → ค่าที่ input[type="datetime-local"] รับได้ (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (isoStr: string): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    // ใช้ local timezone offset เพื่อให้ค่าที่แสดงตรงกับเวลาไทย
    const offset = d.getTimezoneOffset() * 60 * 1000;
    const local  = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  } catch {
    return '';
  }
};

//@ รายการประเภทกิจกรรม (เหมือนกับ CreateActivityPage)
const CATEGORIES = [
  '', 'มหาวิทยาลัย', 'คณะวิศวกรรมศาสตร์', 'คณะครุศาสตร์อุตสาหกรรม',
  'คณะวิทยาศาสตร์ประยุกต์', 'คณะเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
  'คณะศิลปศาสตร์ประยุกต์', 'คณะสถาปัตยกรรมและการออกแบบ',
  'คณะพัฒนาธุรกิจและอุตสาหกรรม', 'วิทยาลัยเทคโนโลยีอุตสาหกรรม', 'วิทยาลัยนานาชาติ',
];

export const EditActivityPage: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ===== Form fields =====
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [startAt,     setStartAt]     = useState('');
  const [endAt,       setEndAt]       = useState('');

  //@ originalData เก็บข้อมูลที่โหลดมาจาก API เพื่อตรวจว่ามีการเปลี่ยนแปลงหรือไม่
  //  ใช้ ActivityForEdit แทน any
  const [originalData, setOriginalData] = useState<ActivityForEdit | null>(null);

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  //@ โหลดข้อมูลกิจกรรมที่จะแก้ไข
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await ActivityService.getById(Number(id));
        // ใช้ type ชัดเจนแทน any
        const a: ActivityForEdit = res.data;
        setOriginalData(a);
        setTitle(a.title             || '');
        setDescription(a.description || '');
        setCategory(a.category       || '');
        //! แปลง ISO → datetime-local เพื่อให้แสดงเวลาไทยที่ถูกต้อง
        setStartAt(toDatetimeLocal(a.start_at));
        setEndAt(toDatetimeLocal(a.end_at));
      } catch (err: unknown) {
        setError(parseApiError(err, 'โหลดกิจกรรมไม่สำเร็จ'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  //@ ตรวจว่ามีการเปลี่ยนแปลงจากข้อมูลเดิมหรือไม่
  const hasChanges = originalData !== null && (
    title.trim()       !== (originalData.title        || '') ||
    description.trim() !== (originalData.description  || '') ||
    category           !== (originalData.category     || '') ||
    startAt            !== toDatetimeLocal(originalData.start_at) ||
    endAt              !== toDatetimeLocal(originalData.end_at)
  );

  //@ ตรวจสอบ form ก่อนเปิด Modal ยืนยัน
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) { setFormError('กรุณากรอกชื่อกิจกรรม'); return; }
    if (!startAt)      { setFormError('กรุณากำหนดวันเวลาเริ่มต้น'); return; }
    if (!endAt)        { setFormError('กรุณากำหนดวันเวลาสิ้นสุด'); return; }
    if (new Date(endAt) <= new Date(startAt)) {
      setFormError('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');
      return;
    }
    if (!hasChanges) {
      setFormError('ไม่มีการเปลี่ยนแปลงข้อมูล');
      return;
    }
    setShowConfirm(true);
  };

  //@ บันทึกการแก้ไขหลัง User ยืนยัน
  const confirmUpdate = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await ActivityService.update(
        Number(id),
        {
          title:       title.trim(),
          description: description.trim() || undefined,
          category:    category           || undefined,
          //! แปลง datetime-local string → ISO string ก่อนส่ง Backend
          start_at:    new Date(startAt).toISOString(),
          end_at:      new Date(endAt).toISOString(),
        },
        token!
      );
      setShowSuccess(true);
    } catch (err: unknown) {
      setFormError(parseApiError(err, 'บันทึกไม่สำเร็จ'));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading / Error ───────────────────────────────────────
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">กำลังโหลดกิจกรรม...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-secondary" onClick={() => navigate('/activities')}>
          ← กลับ
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="border-0 shadow-sm rounded-4 p-4 mx-auto" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">✏️ แก้ไขกิจกรรม</h3>
          <Button variant="outline-secondary" size="sm" className="rounded-pill"
            onClick={() => navigate(`/activities/${id}`)}>
            ← กลับ
          </Button>
        </div>

        {/* อีเว้นท์ต้นทาง (อ่านอย่างเดียว) */}
        {originalData && (
          <Alert variant="info" className="py-2 small">
            📂 อีเว้นท์ต้นทาง: <strong>{originalData.event_name}</strong>
            <br />
            <span className="text-muted">ไม่สามารถเปลี่ยนอีเว้นท์ได้ หากต้องการเปลี่ยนกรุณาสร้างกิจกรรมใหม่</span>
          </Alert>
        )}

        {formError && <Alert variant="danger">{formError}</Alert>}

        <Form onSubmit={handleSubmitClick}>
          <Row className="g-3">
            {/* ชื่อกิจกรรม */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  ชื่อกิจกรรม <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* ประเภทกิจกรรม */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold">ประเภทกิจกรรม</Form.Label>
                <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c || '-- ไม่ระบุ --'}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* วันเวลาเริ่มต้น */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  วันเวลาเริ่มต้น <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* วันเวลาสิ้นสุด */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  วันเวลาสิ้นสุด <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={endAt}
                  min={startAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* คำอธิบาย */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold">คำอธิบาย</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* ปุ่ม */}
          <div className="d-grid gap-2 mt-4">
            <Button
              type="submit"
              variant="warning"
              className="fw-bold rounded-pill py-2"
              disabled={submitting || !hasChanges}
              style={{ opacity: hasChanges ? 1 : 0.5 }}
            >
              {submitting
                ? <><Spinner size="sm" className="me-1" />กำลังบันทึก...</>
                : '💾 บันทึกการแก้ไข'}
            </Button>
            <Button
              variant="light"
              className="rounded-pill"
              onClick={() => navigate(`/activities/${id}`)}
            >
              ยกเลิก
            </Button>
          </div>
        </Form>
      </Card>

      {/* Modal ยืนยันก่อน submit */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">⚠️ ยืนยันการแก้ไข</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3">
          <p className="fs-5 mb-1">ต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่?</p>
          <small className="text-muted">ข้อมูลกิจกรรมจะถูกอัปเดตทันที</small>
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
          <Button variant="warning" className="fw-bold" onClick={confirmUpdate}>
            ✅ ยืนยันบันทึก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal สำเร็จ */}
      <Modal show={showSuccess} onHide={() => { setShowSuccess(false); navigate(`/activities/${id}`); }} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="fw-bold">✅ บันทึกสำเร็จ</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3 fs-5">
          แก้ไขข้อมูลกิจกรรมเรียบร้อยแล้ว
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button
            variant="success"
            onClick={() => { setShowSuccess(false); navigate(`/activities/${id}`); }}
          >
            กลับไปดูกิจกรรม
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};