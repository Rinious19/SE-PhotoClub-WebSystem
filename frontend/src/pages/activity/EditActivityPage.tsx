import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Card, Form, Button, Row, Col,
  Spinner, Alert, Modal, Badge,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { ActivityService }        from '@/services/ActivityService';
import { EventService }           from '@/services/EventService';
import { PhotoService }           from '@/services/PhotoService';
import { parseApiError }          from '@/utils/apiError';
import { CustomDatePicker }       from '@/components/common/CustomDatePicker';

interface ActivityForEdit {
  id:                 number;
  title:              string;
  description?:       string;
  event_name:         string;
  event_id?:          number;
  faculty?:           string;
  academic_year?:     string;
  start_at:           string;
  end_at:             string;
  status:             'UPCOMING' | 'ACTIVE' | 'ENDED';
  photos?:            any[];
  excluded_photo_ids?: number[];
}

interface PhotoItem {
  id:            number;
  title:         string;
  image_url:     string;
  thumbnail_url: string | null;
  faculty?:      string;
  academic_year?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

const parseApiDateStr = (dateStr: string) => {
  if (!dateStr) return { d: '', t: '00:00' };
  const cleanStr = dateStr.replace('T', ' '); 
  const [datePart, timePart] = cleanStr.split(' ');
  return {
    d: datePart || '',
    t: timePart ? timePart.substring(0, 5) : '00:00'
  };
};

const formatThaiDateTime = (isoStr: string) => {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear() + 543;
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} เวลา ${hh}:${min} น.`;
  } catch {
    return isoStr;
  }
};

const TimePicker24: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [h, m] = (value || '00:00').split(':');
  const startY = useRef<number | null>(null);
  const startVal = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (e.key === 'ArrowUp') { e.preventDefault(); updateTime(type, type === 'h' ? h : m, 1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); updateTime(type, type === 'h' ? h : m, -1); }
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
    <div ref={containerRef} className="d-flex align-items-center justify-content-center border border-secondary-subtle rounded bg-white px-2" style={{ height: '38px', width: '100px', transition: 'border-color 0.15s' }}>
      <input type="text" className="border-0 bg-transparent text-center p-0" style={{ outline: 'none', fontWeight: '500', width: '28px', fontSize: '15px', touchAction: 'none', cursor: 'ns-resize', userSelect: 'none' }} value={h} maxLength={2} onChange={handleHourChange} onBlur={handleHourBlur} onWheel={(e) => handleWheel(e, 'h')} onPointerDown={(e) => handlePointerDown(e, 'h')} onPointerMove={(e) => handlePointerMove(e, 'h')} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onKeyDown={(e) => handleKeyDown(e, 'h')} placeholder="00" />
      <span className="fw-bold text-secondary mx-1 mb-1" style={{ userSelect: 'none' }}>:</span>
      <input type="text" className="border-0 bg-transparent text-center p-0" style={{ outline: 'none', fontWeight: '500', width: '28px', fontSize: '15px', touchAction: 'none', cursor: 'ns-resize', userSelect: 'none' }} value={m} maxLength={2} onChange={handleMinuteChange} onBlur={handleMinuteBlur} onWheel={(e) => handleWheel(e, 'm')} onPointerDown={(e) => handlePointerDown(e, 'm')} onPointerMove={(e) => handlePointerMove(e, 'm')} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onKeyDown={(e) => handleKeyDown(e, 'm')} placeholder="00" />
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
  
  // ✅ เพิ่ม State สำหรับเก็บ Event ทั้งหมดในระบบ
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState<number | null>(null);
  
  const [eventPhotos, setEventPhotos] = useState<PhotoItem[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  
  const [initialExcludedPhotoIds, setInitialExcludedPhotoIds] = useState<Set<number>>(new Set());
  const [excludedPhotoIds, setExcludedPhotoIds] = useState<Set<number>>(new Set());

  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterYear,    setFilterYear]    = useState('');

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentStartAt = startDate && startTime ? `${startDate}T${startTime}` : '';
  const currentEndAt   = endDate && endTime ? `${endDate}T${endTime}` : '';

  const getLocalISO = (dateStr: string) => {
    const obj = parseApiDateStr(dateStr);
    return obj.d && obj.t ? `${obj.d}T${obj.t}` : '';
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        // ✅ โหลด Events ทั้งหมดมารอไว้สำหรับ Dropdown
        const resEv = await EventService.getAll();
        setAllEvents(resEv.data || []);

        const resAct = await ActivityService.getById(Number(id));
        const a: ActivityForEdit = resAct.data;
        
        setTitle(a.title || '');
        setDescription(a.description || '');
        
        if (a.faculty && a.faculty !== 'ไม่ระบุ' && a.faculty !== 'undefined') setFilterFaculty(a.faculty);
        if (a.academic_year && a.academic_year !== 'ไม่ระบุ' && a.academic_year !== 'undefined') setFilterYear(a.academic_year);
        
        const startObj = parseApiDateStr(a.start_at);
        setStartDate(startObj.d);
        setStartTime(startObj.t);
        
        const endObj = parseApiDateStr(a.end_at);
        setEndDate(endObj.d);
        setEndTime(endObj.t);

        let evId = a.event_id;
        if (!evId) {
          const matched = resEv.data?.find((e: any) => e.event_name === a.event_name);
          if (matched) evId = matched.id;
        }
        
        // ✅ ผูก event_id ให้ originalData สมบูรณ์ เพื่อเช็คว่ามีการเปลี่ยนอีเว้นท์หรือไม่
        setOriginalData({ ...a, event_id: evId });
        setEventId(evId || null);

      } catch (err: unknown) {
        setError(parseApiError(err, 'โหลดกิจกรรมไม่สำเร็จ'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!eventId || !originalData) return;
    setPhotosLoading(true);
    PhotoService.getByEvent(eventId, 1)
      .then(res => {
        const allPhotos: PhotoItem[] = res.data || [];
        setEventPhotos(allPhotos);

        let excluded = new Set<number>();
        
        // ✅ ถ้าดึงรูปของอีเว้นท์ "เดิม" ให้คืนค่าการจำรูปเดิม
        if (eventId === originalData.event_id) {
          if (originalData.excluded_photo_ids !== undefined) {
            originalData.excluded_photo_ids.forEach(pid => excluded.add(Number(pid)));
          } else if (originalData.photos && originalData.photos.length > 0) {
            const included = new Set(originalData.photos.map((p: any) => Number(p.photo_id || p.id)));
            allPhotos.forEach(p => { 
              if (!included.has(Number(p.id))) excluded.add(Number(p.id)); 
            });
          }
        } 
        // ✅ ถ้าเปลี่ยนเป็นอีเว้นท์ "ใหม่" ค่า default คือเลือกทุกรูป (ไม่ exclude เลย)
        
        setInitialExcludedPhotoIds(excluded);
        setExcludedPhotoIds(new Set(excluded));
      })
      .catch(() => setEventPhotos([]))
      .finally(() => setPhotosLoading(false));
  }, [eventId, originalData]);

  const displayedPhotos = useMemo(() => eventPhotos.filter(p => {
    const facultyMatch = !filterFaculty || (p.faculty || '') === filterFaculty;
    const yearMatch    = !filterYear    || (p.academic_year || '') === filterYear;
    return facultyMatch && yearMatch;
  }), [eventPhotos, filterFaculty, filterYear]);

  const allDisplayedSelected = useMemo(() => {
    if (displayedPhotos.length === 0) return false;
    return !displayedPhotos.some(p => excludedPhotoIds.has(Number(p.id)));
  }, [displayedPhotos, excludedPhotoIds]);

  const availableFaculties = useMemo(() => [...new Set(eventPhotos.map(p => p.faculty).filter(Boolean))] as string[], [eventPhotos]);
  const availableYears     = useMemo(() => [...new Set(eventPhotos.map(p => p.academic_year).filter(Boolean))] as string[], [eventPhotos]);

  const includedCount = displayedPhotos.filter(p => !excludedPhotoIds.has(Number(p.id))).length;

  const toggleExclude = (photoId: number) => {
    setExcludedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(Number(photoId))) next.delete(Number(photoId));
      else next.add(Number(photoId));
      return next;
    });
  };

  const selectAllDisplayed = () => {
    setExcludedPhotoIds(prev => {
      const next = new Set(prev);
      displayedPhotos.forEach(p => next.delete(Number(p.id)));
      return next;
    });
  };

  const deselectAllDisplayed = () => {
    setExcludedPhotoIds(prev => {
      const next = new Set(prev);
      displayedPhotos.forEach(p => next.add(Number(p.id)));
      return next;
    });
  };

  const addedCount   = Array.from(initialExcludedPhotoIds).filter(id => !excludedPhotoIds.has(id)).length;
  const removedCount = Array.from(excludedPhotoIds).filter(id => !initialExcludedPhotoIds.has(id)).length;
  const photoChanged = addedCount > 0 || removedCount > 0;
  
  // ✅ ตรวจสอบว่ามีการเปลี่ยนอีเว้นท์หรือไม่
  const eventChanged = originalData !== null && eventId !== originalData.event_id;

  const hasChanges = originalData !== null && (
    title.trim()       !== (originalData.title        || '') ||
    description.trim() !== (originalData.description  || '') ||
    currentStartAt     !== getLocalISO(originalData.start_at) ||
    currentEndAt       !== getLocalISO(originalData.end_at) ||
    photoChanged || 
    eventChanged // ✅ รวมกรณีเปลี่ยนอีเว้นท์เข้าไปด้วย
  );

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim())             { setFormError('กรุณากรอกชื่อกิจกรรม'); return; }
    if (!eventId)                  { setFormError('กรุณาเลือกอีเว้นท์'); return; }
    if (!startDate || !startTime)  { setFormError('กรุณากำหนดวันเวลาเริ่มต้นให้ครบถ้วน'); return; }
    if (!endDate || !endTime)      { setFormError('กรุณากำหนดวันเวลาสิ้นสุดให้ครบถ้วน'); return; }
    if (new Date(currentEndAt) <= new Date(currentStartAt)) {
      setFormError('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');
      return;
    }
    if (eventPhotos.length - excludedPhotoIds.size < 1) {
      setFormError('กิจกรรมต้องมีรูปภาพอย่างน้อย 1 รูป');
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

      const excludedIdsArray = Array.from(excludedPhotoIds);

      await ActivityService.update(
        Number(id),
        {
          title:              title.trim(),
          description:        description.trim() || undefined,
          start_at:           formatTimeToSubmit(currentStartAt),
          end_at:             formatTimeToSubmit(currentEndAt),
          faculty:            filterFaculty      || undefined, 
          academic_year:      filterYear         || undefined,
          event_id:           eventId,           
          excluded_photo_ids: excludedIdsArray,   
        } as any, 
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
      <Card className="border-0 shadow-sm rounded-4 p-4 mx-auto" style={{ maxWidth: 880 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">✏️ แก้ไขกิจกรรม</h3>
            <p className="text-muted small mb-0">ปรับเปลี่ยนข้อมูลเวลา หรือ รูปภาพในกิจกรรม</p>
          </div>
          <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={() => navigate(`/activities/${id}`)}>
            ← กลับ
          </Button>
        </div>

        {formError && <Alert variant="danger">{formError}</Alert>}

        <Form onSubmit={handleSubmitClick}>
          <Row className="g-4">
            <Col md={5}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  ชื่อกิจกรรม <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Form.Group>

              {/* ✅ ปรับปรุงส่วนอีเว้นท์ ให้เลือกได้เฉพาะกิจกรรมที่ UPCOMING */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">อีเว้นท์ <span className="text-danger">*</span></Form.Label>
                {originalData?.status === 'UPCOMING' ? (
                  <>
                    <Form.Select 
                      value={eventId || ''} 
                      onChange={(e) => {
                        setEventId(Number(e.target.value));
                        setFilterFaculty(''); // เคลียร์ฟิลเตอร์เมื่อเปลี่ยนอีเว้นท์
                        setFilterYear('');
                      }}
                    >
                      <option value="" disabled>-- เลือกอีเว้นท์ --</option>
                      {allEvents.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.event_name}</option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted small">
                      เปลี่ยนอีเว้นท์ได้เฉพาะตอนที่กิจกรรมยังเป็น "รอดำเนินการ"
                    </Form.Text>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 border rounded bg-light text-muted d-flex align-items-center">
                      <span className="me-2">📂</span> <strong className="text-dark">{originalData?.event_name}</strong>
                    </div>
                    <Form.Text className="text-muted small">
                      ไม่สามารถเปลี่ยนอีเว้นท์ได้ เนื่องจากกิจกรรมเริ่มโหวตหรือสิ้นสุดไปแล้ว
                    </Form.Text>
                  </>
                )}
              </Form.Group>

              <div className="p-3 mb-4 border rounded-4 bg-light shadow-sm">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark mb-2" style={{ fontSize: '0.95rem' }}>
                    🟢 วันเวลาเริ่มต้น <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                      <CustomDatePicker value={startDate} onChange={setStartDate} placeholder="เลือกวันที่เริ่มต้น" size="md" />
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
                      <CustomDatePicker value={endDate} min={startDate} onChange={setEndDate} placeholder="เลือกวันที่สิ้นสุด" size="md" />
                    </div>
                    <TimePicker24 value={endTime} onChange={setEndTime} />
                  </div>
                </Form.Group>
              </div>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">คำอธิบาย</Form.Label>
                <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Form.Group>

              <Button type="submit" variant="warning" className="w-100 fw-bold rounded-pill py-2" disabled={submitting || !hasChanges} style={{ opacity: hasChanges ? 1 : 0.5 }}>
                {submitting ? <><Spinner size="sm" className="me-1" />กำลังบันทึก...</> : '💾 บันทึกการแก้ไข'}
              </Button>
              <Button variant="light" className="w-100 mt-2 rounded-pill" onClick={() => navigate(`/activities/${id}`)}>ยกเลิก</Button>
            </Col>

            <Col md={7}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="fw-bold mb-0">
                  รูปภาพในกิจกรรม
                  {includedCount > 0 && <Badge bg="primary" className="ms-2 rounded-pill">{includedCount} รูป</Badge>}
                </Form.Label>

                {eventPhotos.length > 0 && displayedPhotos.length > 0 && (
                  allDisplayedSelected ? (
                    <button 
                      type="button"
                      onClick={deselectAllDisplayed}
                      className="d-flex align-items-center justify-content-center px-3 py-1 border-0"
                      style={{ borderRadius: '20px', fontSize: '13px', fontWeight: '500', background: '#6c757d', color: '#fff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    >
                      <span style={{ fontSize: '15px', marginRight: '6px', lineHeight: 1 }}>✕</span> 
                      ยกเลิกทั้งหมด
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={selectAllDisplayed}
                      className="d-flex align-items-center justify-content-center px-3 py-1 bg-white"
                      style={{ borderRadius: '20px', fontSize: '13px', fontWeight: '500', color: '#6842ff', border: '1px solid #ced4da', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                    >
                      <span style={{ background: '#6842ff', color: '#fff', borderRadius: '4px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px', fontSize: '11px' }}>✓</span> 
                      เลือกทั้งหมด
                    </button>
                  )
                )}
              </div>

              {photosLoading && (
                <div className="text-center py-5 border rounded-3 bg-light">
                  <Spinner animation="border" size="sm" variant="secondary" />
                  <span className="ms-2 text-muted small">กำลังโหลดรูปภาพ...</span>
                </div>
              )}

              {!photosLoading && eventPhotos.length === 0 && (
                <Alert variant="warning">ไม่พบรูปภาพในอีเว้นท์นี้</Alert>
              )}

              {!photosLoading && eventPhotos.length > 0 && (
                <>
                  {(availableFaculties.length > 0 || availableYears.length > 0) && (
                    <div className="d-flex gap-2 mb-2 flex-wrap align-items-center">
                      <small className="text-muted fw-bold">กรองรูป:</small>
                      {availableFaculties.length > 0 && (
                        <Form.Select size="sm" style={{ width: 'auto' }} value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}>
                          <option value="">-- ทุกคณะ --</option>
                          {availableFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                        </Form.Select>
                      )}
                      {availableYears.length > 0 && (
                        <Form.Select size="sm" style={{ width: 'auto' }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                          <option value="">-- ทุกปี --</option>
                          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </Form.Select>
                      )}
                      {(filterFaculty || filterYear) && (
                        <Button size="sm" variant="outline-secondary" onClick={() => { setFilterFaculty(''); setFilterYear(''); }}>ล้าง</Button>
                      )}
                    </div>
                  )}
                  <p className="text-muted small mb-2">กดที่รูปเพื่อเพิ่ม/นำออกจากกิจกรรม <strong className="text-success">(กรอบเขียว = อยู่ในกิจกรรม)</strong></p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 400, overflowY: 'auto', padding: 4 }}>
                    {displayedPhotos.map((photo) => {
                      const isExcluded = excludedPhotoIds.has(Number(photo.id));
                      const isSelected = !isExcluded; 
                      
                      return (
                        <div key={photo.id} onClick={() => toggleExclude(photo.id)}
                          style={{
                            position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', cursor: 'pointer',
                            opacity: isSelected ? 1 : 0.4, transition: 'all .2s',
                            boxShadow: isSelected ? '0 0 0 3px #198754' : '0 1px 4px rgba(0,0,0,.1)',
                          }}>
                          <img src={getImageUrl(photo.thumbnail_url || photo.image_url)} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
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

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">⚠️ ยืนยันการแก้ไขกิจกรรม</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">ข้อมูลกิจกรรมที่จะเปลี่ยนแปลง:</p>
          <ul className="list-unstyled ps-2 text-secondary small">
            <li>📌 ชื่อ: <strong className="text-dark">{title}</strong></li>
            
            {/* ✅ แสดงการแจ้งเตือนว่าเปลี่ยนอีเว้นท์ใน Modal ยืนยัน */}
            {eventChanged && (
              <li>📌 อีเว้นท์: <strong className="text-primary">{allEvents.find(e => e.id === eventId)?.event_name}</strong> <Badge bg="primary">เปลี่ยนอีเว้นท์ใหม่</Badge></li>
            )}

            <li>🕐 เริ่ม: <strong className="text-dark">{formatThaiDateTime(currentStartAt)}</strong></li>
            <li>🔚 สิ้นสุด: <strong className="text-dark">{formatThaiDateTime(currentEndAt)}</strong></li>
            
            {(photoChanged || eventChanged) && (
              <li className="mt-3 pt-3 border-top">
                🖼️ <strong>สถานะรูปภาพ:</strong>
                <div className="mt-2 d-flex flex-column gap-1">
                  {!eventChanged && addedCount > 0 && <span><Badge bg="success" className="me-2">เพิ่มเข้า</Badge> <strong className="text-success">{addedCount} รูป</strong></span>}
                  {!eventChanged && removedCount > 0 && <span><Badge bg="danger" className="me-2">นำออก</Badge> <strong className="text-danger">{removedCount} รูป</strong></span>}
                  <span className="mt-1">✅ รวมรูปภาพในกิจกรรม: <strong>{eventPhotos.length - excludedPhotoIds.size} รูป</strong></span>
                </div>
              </li>
            )}
          </ul>
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