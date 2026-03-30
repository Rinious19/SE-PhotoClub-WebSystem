import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Card, Form, Button, Row, Col,
  Spinner, Alert, Modal,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { ActivityService }        from '@/services/ActivityService';
import { parseApiError }          from '@/utils/apiError';
import { CustomDatePicker }       from '@/components/common/CustomDatePicker';

interface ActivityForEdit {
  id:           number;
  title:        string;
  description?: string;
  event_name:   string;
  start_at:     string;
  end_at:       string;
  status:       'UPCOMING' | 'ACTIVE' | 'ENDED';
}

const toDatetimeLocal = (isoStr: string): string => {
  if (!isoStr) return '';
  try { return isoStr.substring(0, 16); } catch { return ''; }
};

// ✅ คอมโพเนนต์กรอกเวลา (อัปเดต: ป้องกันหน้าเว็บเลื่อนตาม และ ป้องกันคลุมดำ)
const TimePicker24: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [h, m] = (value || '00:00').split(':');
  
  const startY = useRef<number | null>(null);
  const startVal = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🛡️ ป้องกันหน้าเว็บเลื่อนตอนหมุนล้อเมาส์
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventScroll = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => el.removeEventListener('wheel', preventScroll);
  }, []);

  const updateTime = (type: 'h' | 'm', currentStr: string, delta: number) => {
    let val = parseInt(currentStr || '0', 10);
    val += delta;
    if (type === 'h') {
      val = ((val % 24) + 24) % 24; 
      onChange(`${String(val).padStart(2, '0')}:${m}`);
    } else {
      val = ((val % 60) + 60) % 60; 
      onChange(`${h}:${String(val).padStart(2, '0')}`);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>, type: 'h' | 'm') => {
    const delta = e.deltaY < 0 ? 1 : -1;
    updateTime(type, type === 'h' ? h : m, delta);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>, type: 'h' | 'm') => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    startVal.current = parseInt(type === 'h' ? h : m, 10) || 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLInputElement>, type: 'h' | 'm') => {
    if (startY.current === null) return;
    const deltaY = startY.current - e.clientY;
    const steps = Math.floor(deltaY / 8); 
    if (steps !== 0) {
      let val = startVal.current + steps;
      if (type === 'h') {
        val = ((val % 24) + 24) % 24;
        onChange(`${String(val).padStart(2, '0')}:${m}`);
      } else {
        val = ((val % 60) + 60) % 60;
        onChange(`${h}:${String(val).padStart(2, '0')}`);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    startY.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'h' | 'm') => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      updateTime(type, type === 'h' ? h : m, 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateTime(type, type === 'h' ? h : m, -1);
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (parseInt(val) > 23) val = '23'; 
    onChange(`${val}:${m}`);
  };

  const handleHourBlur = () => {
    let val = h;
    if (val === '') val = '00';
    else if (val.length === 1) val = `0${val}`; 
    onChange(`${val}:${m}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (parseInt(val) > 59) val = '59'; 
    onChange(`${h}:${val}`);
  };

  const handleMinuteBlur = () => {
    let val = m;
    if (val === '') val = '00';
    else if (val.length === 1) val = `0${val}`;
    onChange(`${h}:${val}`);
  };

  return (
    <div 
      ref={containerRef}
      className="d-flex align-items-center justify-content-center border border-secondary-subtle rounded bg-white px-2" 
      style={{ height: '38px', width: '100px', transition: 'border-color 0.15s' }}
    >
      <input
        type="text"
        className="border-0 bg-transparent text-center p-0"
        style={{ outline: 'none', fontWeight: '500', width: '28px', fontSize: '15px', touchAction: 'none', cursor: 'ns-resize', userSelect: 'none' }}
        value={h}
        maxLength={2}
        onChange={handleHourChange}
        onBlur={handleHourBlur}
        onWheel={(e) => handleWheel(e, 'h')}
        onPointerDown={(e) => handlePointerDown(e, 'h')}
        onPointerMove={(e) => handlePointerMove(e, 'h')}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(e) => handleKeyDown(e, 'h')}
        placeholder="00"
      />
      <span className="fw-bold text-secondary mx-1 mb-1" style={{ userSelect: 'none' }}>:</span>
      <input
        type="text"
        className="border-0 bg-transparent text-center p-0"
        style={{ outline: 'none', fontWeight: '500', width: '28px', fontSize: '15px', touchAction: 'none', cursor: 'ns-resize', userSelect: 'none' }}
        value={m}
        maxLength={2}
        onChange={handleMinuteChange}
        onBlur={handleMinuteBlur}
        onWheel={(e) => handleWheel(e, 'm')}
        onPointerDown={(e) => handlePointerDown(e, 'm')}
        onPointerMove={(e) => handlePointerMove(e, 'm')}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(e) => handleKeyDown(e, 'm')}
        placeholder="00"
      />
    </div>
  );
};

export const EditActivityPage: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [endTime,   setEndTime]   = useState('');

  const [originalData, setOriginalData] = useState<ActivityForEdit | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentStartAt = startDate && startTime ? `${startDate}T${startTime}` : '';
  const currentEndAt   = endDate && endTime ? `${endDate}T${endTime}` : '';

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await ActivityService.getById(Number(id));
        const a: ActivityForEdit = res.data;
        setOriginalData(a);
        setTitle(a.title             || '');
        setDescription(a.description || '');
        
        const dtStart = toDatetimeLocal(a.start_at);
        if (dtStart) {
          const [d, t] = dtStart.split('T');
          setStartDate(d);
          setStartTime(t);
        }
        
        const dtEnd = toDatetimeLocal(a.end_at);
        if (dtEnd) {
          const [d, t] = dtEnd.split('T');
          setEndDate(d);
          setEndTime(t);
        }
      } catch (err: unknown) {
        setError(parseApiError(err, 'โหลดกิจกรรมไม่สำเร็จ'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const hasChanges = originalData !== null && (
    title.trim()       !== (originalData.title        || '') ||
    description.trim() !== (originalData.description  || '') ||
    currentStartAt     !== toDatetimeLocal(originalData.start_at) ||
    currentEndAt       !== toDatetimeLocal(originalData.end_at)
  );

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim())             { setFormError('กรุณากรอกชื่อกิจกรรม'); return; }
    if (!startDate || !startTime)  { setFormError('กรุณากำหนดวันเวลาเริ่มต้นให้ครบถ้วน'); return; }
    if (!endDate || !endTime)      { setFormError('กรุณากำหนดวันเวลาสิ้นสุดให้ครบถ้วน'); return; }
    if (new Date(currentEndAt) <= new Date(currentStartAt)) {
      setFormError('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');
      return;
    }
    if (!hasChanges) {
      setFormError('ไม่มีการเปลี่ยนแปลงข้อมูล');
      return;
    }
    setShowConfirm(true);
  };

  const confirmUpdate = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formatTimeToSubmit = (timeStr: string) => timeStr ? `${timeStr}:00Z` : '';

      await ActivityService.update(
        Number(id),
        {
          title:       title.trim(),
          description: description.trim() || undefined,
          start_at:    formatTimeToSubmit(currentStartAt),
          end_at:      formatTimeToSubmit(currentEndAt),
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
        <Button variant="outline-secondary" onClick={() => navigate('/activities')}>← กลับ</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="border-0 shadow-sm rounded-4 p-4 mx-auto" style={{ maxWidth: 600 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">✏️ แก้ไขกิจกรรม</h3>
          <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={() => navigate(`/activities/${id}`)}>
            ← กลับ
          </Button>
        </div>

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
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  ชื่อกิจกรรม <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <div className="p-3 my-2 border rounded-4 bg-light shadow-sm">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark mb-2" style={{ fontSize: '0.95rem' }}>
                    🟢 วันเวลาเริ่มต้น <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                      <CustomDatePicker 
                        value={startDate} 
                        onChange={setStartDate} 
                        placeholder="เลือกวันที่เริ่มต้น"
                        size="md"
                      />
                    </div>
                    <TimePicker24 value={startTime} onChange={setStartTime} />
                  </div>
                </Form.Group>

                <Form.Group className="mb-1">
                  <Form.Label className="fw-bold text-dark mb-2" style={{ fontSize: '0.95rem' }}>
                    🔴 วันเวลาสิ้นสุด <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                      <CustomDatePicker 
                        value={endDate} 
                        min={startDate}
                        onChange={setEndDate} 
                        placeholder="เลือกวันที่สิ้นสุด"
                        size="md"
                      />
                    </div>
                    <TimePicker24 value={endTime} onChange={setEndTime} />
                  </div>
                </Form.Group>
              </div>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold">คำอธิบาย</Form.Label>
                <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-grid gap-2 mt-4">
            <Button type="submit" variant="warning" className="fw-bold rounded-pill py-2" disabled={submitting || !hasChanges} style={{ opacity: hasChanges ? 1 : 0.5 }}>
              {submitting ? <><Spinner size="sm" className="me-1" />กำลังบันทึก...</> : '💾 บันทึกการแก้ไข'}
            </Button>
            <Button variant="light" className="rounded-pill" onClick={() => navigate(`/activities/${id}`)}>ยกเลิก</Button>
          </div>
        </Form>
      </Card>

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
          <Button variant="warning" className="fw-bold" onClick={confirmUpdate}>✅ ยืนยันบันทึก</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSuccess} onHide={() => { setShowSuccess(false); navigate(`/activities/${id}`); }} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="fw-bold">✅ บันทึกสำเร็จ</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3 fs-5">แก้ไขข้อมูลกิจกรรมเรียบร้อยแล้ว</Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="success" onClick={() => { setShowSuccess(false); navigate(`/activities/${id}`); }}>กลับไปดูกิจกรรม</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};