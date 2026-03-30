import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Container, Card, Form, Button, Row, Col,
  Spinner, Alert, Badge, Modal,
} from 'react-bootstrap';
import { useNavigate }      from 'react-router-dom';
import { ActivityService }  from '@/services/ActivityService';
import { EventService }     from '@/services/EventService';
import { PhotoService }     from '@/services/PhotoService';
import { parseApiError }    from '@/utils/apiError';

//@ กำหนด type ของ Event จาก API
interface EventItem {
  id:         number;
  event_name: string;
  event_date: string;
}

//@ กำหนด type ของ Photo จาก API
interface PhotoItem {
  id:            number;
  title:         string;
  image_url:     string;
  thumbnail_url: string | null;
  faculty?:      string;
  academic_year?: string;
}

const BASE_URL = 'http://localhost:5000';
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

export const CreateActivityPage: React.FC = () => {
  const navigate     = useNavigate();
  const dropdownRef  = useRef<HTMLDivElement>(null);

  // ===== Form fields =====
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [eventName,   setEventName]   = useState('');
  //* context — เก็บ event_id คู่กับ event_name เพื่อส่งให้ PhotoService และ backend
  const [eventId,     setEventId]     = useState<number | null>(null);
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterYear,    setFilterYear]    = useState('');
  const [startAt,     setStartAt]     = useState('');
  const [endAt,       setEndAt]       = useState('');

  // ===== Dropdown อีเว้นท์ =====
  const [events,             setEvents]             = useState<EventItem[]>([]);
  const [eventDropdownOpen,  setEventDropdownOpen]  = useState(false);

  // ===== รูปภาพจากอีเว้นท์ที่เลือก =====
  const [eventPhotos,     setEventPhotos]     = useState<PhotoItem[]>([]);
  const [photosLoading,   setPhotosLoading]   = useState(false);
  //@ excludedPhotoIds เก็บ photos.id ที่ CLUB_PRESIDENT เลือกเอาออก
  const [excludedPhotoIds, setExcludedPhotoIds] = useState<Set<number>>(new Set());

  // ===== สถานะ submit =====
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);

  // Modal ยืนยันก่อน submit
  const [showConfirm, setShowConfirm] = useState(false);

  //@ โหลดรายการอีเว้นท์ทั้งหมดเมื่อ mount
  useEffect(() => {
    EventService.getAll()
      .then((res) => setEvents(res.data || []))
      .catch(() => {});
  }, []);

  //@ ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEventDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  //@ เมื่อเลือกอีเว้นท์ → ดึงรูปภาพทั้งหมดจากอีเว้นท์นั้นด้วย event_id
  useEffect(() => {
    if (!eventId) {
      setEventPhotos([]);
      setExcludedPhotoIds(new Set());
      return;
    }
    setPhotosLoading(true);
    //* context — ใช้ eventId (number) แทน eventName (string) แก้ TypeScript error
    PhotoService.getByEvent(eventId, 1)
      .then((res) => {
        setEventPhotos(res.data || []);
        setExcludedPhotoIds(new Set());
      })
      .catch(() => setEventPhotos([]))
      .finally(() => setPhotosLoading(false));
  }, [eventId]);

  //@ toggle รูปเพื่อ include/exclude
  const toggleExclude = (photoId: number) => {
    setExcludedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  // จำนวนรูปที่จะอยู่ในกิจกรรมจริง
  const isValidEvent = events.some((ev) => ev.event_name === eventName);

  //? กรองรูปตาม faculty และ academic_year ที่เลือก
  const displayedPhotos = useMemo(() => eventPhotos.filter(p => {
    const facultyMatch = !filterFaculty || (p.faculty || '') === filterFaculty;
    const yearMatch    = !filterYear    || (p.academic_year || '') === filterYear;
    return facultyMatch && yearMatch;
  }), [eventPhotos, filterFaculty, filterYear]);

  const availableFaculties = useMemo(() =>
    [...new Set(eventPhotos.map(p => p.faculty).filter(Boolean))] as string[],
    [eventPhotos]);

  const availableYears = useMemo(() =>
    [...new Set(eventPhotos.map(p => p.academic_year).filter(Boolean))] as string[],
    [eventPhotos]);

  const includedCount = displayedPhotos.filter(p => !excludedPhotoIds.has(p.id)).length;

  const filteredEvents = useMemo(() =>
    events.filter(ev => ev.event_name.toLowerCase().includes(eventName.toLowerCase())),
    [events, eventName]);

  //@ ตรวจสอบ form ก่อนเปิด Modal ยืนยัน
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim())    { setFormError('กรุณากรอกชื่อกิจกรรม');       return; }
    if (!isValidEvent)    { setFormError('กรุณาเลือกอีเว้นท์');          return; }
    if (!startAt)         { setFormError('กรุณากำหนดวันเวลาเริ่มต้น');   return; }
    if (!endAt)           { setFormError('กรุณากำหนดวันเวลาสิ้นสุด');   return; }
    if (new Date(endAt) <= new Date(startAt)) {
      setFormError('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');
      return;
    }
    if (includedCount < 1) {
      setFormError('กิจกรรมต้องมีรูปภาพอย่างน้อย 1 รูป');
      return;
    }
    setShowConfirm(true);
  };

  //@ submit จริงหลัง User ยืนยัน
  const confirmSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      const formatTimeToSubmit = (timeStr: string) => {
        if (!timeStr) return '';
        return `${timeStr}:00Z`;
      };

      const res = await ActivityService.create(
        {
          title:               title.trim(),
          description:         description.trim() || undefined,
          event_name:          eventName,
          event_id:            eventId!,
          faculty:             filterFaculty      || undefined,
          academic_year:       filterYear         || undefined,
          start_at:            formatTimeToSubmit(startAt),
          end_at:              formatTimeToSubmit(endAt),
          excluded_photo_ids:  Array.from(excludedPhotoIds),
        },
        token!
      );
      if (res.success) {
        navigate(`/activities/${res.data.id}`);
      }
    } catch (err: unknown) {
      setFormError(parseApiError(err, 'สร้างกิจกรรมไม่สำเร็จ'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="border-0 shadow-sm rounded-4 p-4 mx-auto" style={{ maxWidth: 880 }}>
        <h3 className="fw-bold mb-1">🎯 สร้างกิจกรรมโหวต</h3>
        <p className="text-muted small mb-4">
          เลือกอีเว้นท์ กำหนดเวลา และปรับรูปภาพที่จะเอามาโหวต
        </p>

        {formError && <Alert variant="danger">{formError}</Alert>}

        <Form onSubmit={handleSubmitClick}>
          <Row className="g-4">
            {/* ─── คอลัมน์ซ้าย: ข้อมูลกิจกรรม ─── */}
            <Col md={5}>
              {/* ชื่อกิจกรรม */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  ชื่อกิจกรรม <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="เช่น โหวตภาพสวยงามประจำปี 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Form.Group>

              {/* อีเว้นท์ (Searchable Dropdown) */}
              <Form.Group className="mb-3" ref={dropdownRef}>
                <Form.Label className="fw-bold">
                  อีเว้นท์ <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="พิมพ์เพื่อค้นหาอีเว้นท์..."
                  value={eventName}
                  onChange={(e) => { setEventName(e.target.value); setEventId(null); setEventDropdownOpen(true); }}
                  onFocus={() => setEventDropdownOpen(true)}
                  autoComplete="off"
                />
                {eventDropdownOpen && filteredEvents.length > 0 && (
                  <div style={{
                    position: 'absolute', zIndex: 1000,
                    background: '#fff', border: '1px solid #dee2e6',
                    borderRadius: 8, marginTop: 2, maxHeight: 200, overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,.12)', width: '100%',
                  }}>
                    {filteredEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="px-3 py-2"
                        style={{ cursor: 'pointer' }}
                        onMouseOver={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                        onMouseOut={(e)  => (e.currentTarget.style.background = '#fff')}
                        onClick={() => { setEventName(ev.event_name); setEventId(ev.id); setEventDropdownOpen(false); }}
                      >
                        <span className="fw-bold text-primary">{ev.event_name}</span>
                        <span className="text-muted small ms-2">{ev.event_date?.split('T')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
                {eventName && !isValidEvent && (
                  <Form.Text className="text-danger">* โปรดเลือกจากรายการอีเว้นท์</Form.Text>
                )}
              </Form.Group>

              {/* วันเวลาเริ่มต้น */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  วันเวลาเริ่มต้น <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </Form.Group>

              {/* วันเวลาสิ้นสุด */}
              <Form.Group className="mb-3">
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

              {/* คำอธิบาย */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">คำอธิบาย</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="รายละเอียดกิจกรรม (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>

              {/* ปุ่ม Submit */}
              <Button
                type="submit"
                variant="primary"
                className="w-100 fw-bold rounded-pill py-2"
                disabled={submitting || !isValidEvent}
              >
                {submitting
                  ? <><Spinner size="sm" className="me-1" />กำลังสร้าง...</>
                  : '🎯 สร้างกิจกรรม'}
              </Button>
              <Button
                variant="light"
                className="w-100 mt-2 rounded-pill"
                onClick={() => navigate('/activities')}
              >
                ยกเลิก
              </Button>
            </Col>

            {/* ─── คอลัมน์ขวา: เลือกรูปภาพ ─── */}
            <Col md={7}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="fw-bold mb-0">
                  รูปภาพในกิจกรรม
                  {includedCount > 0 && (
                    <Badge bg="primary" className="ms-2 rounded-pill">{includedCount} รูป</Badge>
                  )}
                </Form.Label>
                {excludedPhotoIds.size > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => setExcludedPhotoIds(new Set())}
                  >
                    รีเซ็ต
                  </Button>
                )}
              </div>

              {!eventName && (
                <div className="border rounded-3 d-flex align-items-center justify-content-center bg-light"
                  style={{ minHeight: 200 }}>
                  <p className="text-muted small text-center">
                    เลือกอีเว้นท์เพื่อดูรูปภาพที่จะนำมาโหวต
                  </p>
                </div>
              )}

              {eventName && photosLoading && (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" variant="secondary" />
                  <span className="ms-2 text-muted small">กำลังโหลดรูปภาพ...</span>
                </div>
              )}

              {eventName && !photosLoading && eventPhotos.length === 0 && (
                <Alert variant="warning">ไม่พบรูปภาพในอีเว้นท์นี้</Alert>
              )}

              {!photosLoading && eventPhotos.length > 0 && (
                <>
                  {/* ─── Filter คณะ / ปีการศึกษา ─── */}
                  {(availableFaculties.length > 0 || availableYears.length > 0) && (
                    <div className="d-flex gap-2 mb-2 flex-wrap align-items-center">
                      <small className="text-muted fw-bold">กรองรูป:</small>
                      {availableFaculties.length > 0 && (
                        <Form.Select size="sm" style={{ width: 'auto' }}
                          value={filterFaculty}
                          onChange={e => { setFilterFaculty(e.target.value); setExcludedPhotoIds(new Set()); }}>
                          <option value="">-- ทุกคณะ --</option>
                          {availableFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                        </Form.Select>
                      )}
                      {availableYears.length > 0 && (
                        <Form.Select size="sm" style={{ width: 'auto' }}
                          value={filterYear}
                          onChange={e => { setFilterYear(e.target.value); setExcludedPhotoIds(new Set()); }}>
                          <option value="">-- ทุกปี --</option>
                          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </Form.Select>
                      )}
                      {(filterFaculty || filterYear) && (
                        <Button size="sm" variant="outline-secondary"
                          onClick={() => { setFilterFaculty(''); setFilterYear(''); setExcludedPhotoIds(new Set()); }}>
                          ล้าง
                        </Button>
                      )}
                      <Badge bg="secondary">{displayedPhotos.length} รูป</Badge>
                    </div>
                  )}
                  <p className="text-muted small mb-2">
                    กดที่รูปเพื่อ <strong className="text-danger">ยกเว้น</strong> ออกจากกิจกรรม
                    (รูปที่มีกากบาทจะไม่ถูกนำมาโหวต)
                  </p>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 6, maxHeight: 400, overflowY: 'auto', padding: 4,
                  }}>
                    {displayedPhotos.map((photo) => {
                      const isExcluded = excludedPhotoIds.has(photo.id);
                      return (
                        <div key={photo.id} onClick={() => toggleExclude(photo.id)}
                          style={{
                            position: 'relative', borderRadius: 8, overflow: 'hidden',
                            aspectRatio: '1', cursor: 'pointer',
                            opacity: isExcluded ? 0.35 : 1, transition: 'opacity .2s',
                            boxShadow: isExcluded ? '0 0 0 2px #dc3545' : '0 1px 4px rgba(0,0,0,.1)',
                          }}>
                          <img src={getImageUrl(photo.thumbnail_url || photo.image_url)}
                            alt={photo.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy" />
                          {isExcluded && (
                            <div style={{
                              position: 'absolute', inset: 0, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(220,53,69,.25)', fontSize: 22,
                              fontWeight: 'bold', color: '#dc3545',
                            }}>✕</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Modal ยืนยันก่อน submit */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">✅ ยืนยันการสร้างกิจกรรม</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">ข้อมูลกิจกรรมที่จะสร้าง:</p>
          <ul className="list-unstyled ps-2 text-secondary small">
            <li>📌 ชื่อ: <strong>{title}</strong></li>
            <li>📂 อีเว้นท์: <strong>{eventName}</strong></li>
            <li>🖼️ รูปในกิจกรรม: <strong>{includedCount} รูป</strong>
              {excludedPhotoIds.size > 0 && (
                <span className="text-danger"> (ยกเว้น {excludedPhotoIds.size} รูป)</span>
              )}
            </li>
            <li>🕐 เริ่ม: <strong>{startAt ? new Date(startAt).toLocaleString('th-TH') : '-'}</strong></li>
            <li>🔚 สิ้นสุด: <strong>{endAt ? new Date(endAt).toLocaleString('th-TH') : '-'}</strong></li>
          </ul>
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>แก้ไข</Button>
          <Button variant="primary" className="fw-bold" onClick={confirmSubmit}>
            ยืนยันสร้าง
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};