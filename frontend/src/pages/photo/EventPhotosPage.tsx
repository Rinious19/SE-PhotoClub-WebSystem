//? Page: Event Photos Page
//@ แสดงรูปทั้งหมดในกิจกรรมนั้น — Lazy Load เมื่อ scroll ถึงด้านล่าง
//  ✅ แสดงรูปแบบ Grid, คลิกขยายได้
//  ✅ ปุ่มแก้ไข/ลบ สำหรับ Admin/President
//  ✅ รับ faculty + academic_year จาก URL query params (ส่งมาจาก PhotoListPage)

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Modal, Badge, Form } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { PhotoService } from '../../services/PhotoService';
import { useAuth } from '@/hooks/useAuth';
import { isAdminOrPresident } from '@/utils/roleChecker';
import { parseApiError } from '@/utils/apiError';

// ✅ แปลง image_url เป็น src URL โดยตรง
const BASE_URL = 'http://localhost:5000';
const getImageUrl = (imageUrl: any): string => {
  if (!imageUrl) return '';
  if (typeof imageUrl === 'string') {
    return imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
  }
  // fallback: BLOB เก่า (migration period)
  try {
    const arr = new Uint8Array(imageUrl.data || imageUrl);
    let bin = '';
    arr.forEach(b => { bin += String.fromCharCode(b); });
    return `data:image/jpeg;base64,${btoa(bin)}`;
  } catch { return ''; }
};

// LazyImage — โหลดรูปเฉพาะเมื่อเข้า viewport
const LazyImage: React.FC<{
  src: string; alt: string; onClick: () => void;
  canEdit: boolean; onEdit: () => void; onDelete: () => void;
}> = ({ src, alt, onClick, canEdit, onEdit, onDelete }) => {
  const [visible, setVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    const el = imgRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  return (
    <div
      ref={imgRef}
      style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#f0f0f0', aspectRatio: '1', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}
      className="photo-item"
    >
      <style>{`.photo-item:hover .photo-overlay { opacity: 1 !important; }`}</style>

      {visible ? (
        <img
          src={src} alt={alt} onClick={onClick}
          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block', transition: 'transform .2s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '')}
          loading="lazy"
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner animation="border" variant="secondary" size="sm" />
        </div>
      )}

      {canEdit && (
        <div className="photo-overlay" style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4, opacity: 0, transition: 'opacity .15s' }}>
          <Button size="sm" variant="warning" style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6 }}
            onClick={(e) => { e.stopPropagation(); onEdit(); }}>✏️</Button>
          <Button size="sm" variant="danger" style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}>🗑️</Button>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────
export const EventPhotosPage: React.FC = () => {
  const { eventName } = useParams<{ eventName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = isAdminOrPresident(user);

  // ✅ อ่าน faculty และ academic_year จาก URL query params
  //  — PhotoListPage ส่งมาตอนคลิก folder เพื่อระบุว่าเข้า folder ไหน
  const [searchParams] = useSearchParams();
  const initFaculty = searchParams.get('faculty') || '';
  const initYear    = searchParams.get('academic_year') || '';

  const decodedName = decodeURIComponent(eventName || '');

  const [photos, setPhotos] = useState<any[]>([]);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // ✅ ตั้งค่า filter จาก URL params ทันที (ไม่ใช่ '' ทั้งคู่)
  const [faculties, setFaculties] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>(initFaculty);
  const [selectedYear, setSelectedYear]       = useState<string>(initYear);

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef  = useRef(false);

  // โหลด filter options ของ event นี้
  useEffect(() => {
    axios.get(`/api/photos/filters/${encodeURIComponent(decodedName)}`)
      .then(r => {
        setFaculties(r.data.data?.faculties || []);
        setAcademicYears(r.data.data?.academicYears || []);
      })
      .catch(() => {});
  }, [decodedName]);

  const fetchPage = useCallback(async (
    pageNum: number,
    faculty = selectedFaculty,
    year    = selectedYear,
  ) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const res = await PhotoService.getByEvent(
        decodedName, pageNum,
        faculty || undefined,
        year    || undefined,
      );
      if (res.success) {
        setPhotos(prev => pageNum === 1 ? res.data : [...prev, ...res.data]);
        setHasMore(res.pagination.hasMore);
        setTotal(res.pagination.total);
      }
    } catch (err: any) { setError(parseApiError(err, 'โหลดรูปภาพไม่สำเร็จ')); }
    finally { loadingRef.current = false; setLoadingMore(false); setInitialLoading(false); }
  }, [decodedName, selectedFaculty, selectedYear]);

  // ✅ Load ครั้งแรกพร้อม filter จาก URL params
  useEffect(() => { fetchPage(1, initFaculty, initYear); }, []);

  // IntersectionObserver — load more
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingRef.current) {
          setLoadingMore(true);
          pageRef.current += 1;
          fetchPage(pageRef.current);
        }
      },
      { threshold: 0.1 }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, fetchPage]);

  // เปลี่ยน filter จาก dropdown ภายในหน้า → reset photos แล้ว fetch ใหม่
  const applyFilter = (faculty: string, year: string) => {
    setSelectedFaculty(faculty);
    setSelectedYear(year);
    setPhotos([]);
    setHasMore(true);
    setInitialLoading(true);
    pageRef.current = 1;
    setTimeout(() => fetchPage(1, faculty, year), 0);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const photoId = deleteTarget;
    setDeleteTarget(null);
    setDeleteError(null);
    try {
      const token = localStorage.getItem('token');
      await PhotoService.delete(photoId, token!);

      //@ ใช้ functional update เพื่อป้องกัน stale closure
      setPhotos(prev => {
        const updated = prev.filter(p => p.id !== photoId);
        //@ navigate ต้องอยู่นอก setPhotos — ใช้ setTimeout เพื่อรอ render cycle
        if (updated.length === 0) {
          setTimeout(() => navigate('/photos'), 0);
        }
        return updated;
      });
      setTotal(prev => prev - 1);
    } catch (err: any) {
      setDeleteError(parseApiError(err, 'ลบรูปภาพไม่สำเร็จ'));
    }
  };

  // label แสดงบน header ว่ากำลังดู folder ไหน
  const folderLabel = [selectedFaculty, selectedYear].filter(Boolean).join(' · ');

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="outline-secondary" size="sm" className="rounded-pill px-3"
          onClick={() => navigate('/photos')}>
          ← กลับ
        </Button>
        <div>
          <h2 className="fw-bold mb-0">📂 {decodedName}</h2>
          {!initialLoading && (
            <p className="text-muted small mb-0">
              {total} รูปภาพ{folderLabel ? ` · ${folderLabel}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Faculty + Academic Year Filter */}
      {(faculties.length > 0 || academicYears.length > 0) && (
        <div className="bg-light rounded-3 p-3 mb-4">
          <Row className="g-2 align-items-end">
            {faculties.length > 0 && (
              <Col md={6}>
                <Form.Label className="fw-medium small text-secondary mb-1">🏛️ คณะ</Form.Label>
                <Form.Select size="sm" value={selectedFaculty}
                  onChange={(e) => applyFilter(e.target.value, selectedYear)}>
                  <option value="">-- ทุกคณะ --</option>
                  {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                </Form.Select>
              </Col>
            )}
            {academicYears.length > 0 && (
              <Col md={4}>
                <Form.Label className="fw-medium small text-secondary mb-1">📅 ปีการศึกษา</Form.Label>
                <Form.Select size="sm" value={selectedYear}
                  onChange={(e) => applyFilter(selectedFaculty, e.target.value)}>
                  <option value="">-- ทุกปี --</option>
                  {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                </Form.Select>
              </Col>
            )}
            {(selectedFaculty || selectedYear) && (
              <Col md={2}>
                <Button size="sm" variant="outline-danger" className="w-100"
                  onClick={() => applyFilter('', '')}>
                  ล้าง
                </Button>
              </Col>
            )}
          </Row>
        </div>
      )}

      {/* Initial loading */}
      {initialLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">กำลังโหลดรูปภาพ...</p>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!initialLoading && photos.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="fs-2">📭</p>
          <h5>ไม่มีรูปภาพในกิจกรรมนี้</h5>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <Row xs={2} sm={3} md={4} lg={5} className="g-3">
          {photos.map(photo => (
            <Col key={photo.id}>
              <LazyImage
                src={getImageUrl(photo.thumbnail_url || photo.image_url)}
                alt={photo.title}
                onClick={() => setLightboxPhoto(photo)}
                canEdit={canEdit}
                onEdit={() => navigate(`/photos/edit/${photo.id}`)}
                onDelete={() => { setDeleteTarget(photo.id); setDeleteError(null); }}
              />
            </Col>
          ))}
        </Row>
      )}

      <div ref={sentinelRef} style={{ height: 40, marginTop: 24 }} />

      {loadingMore && (
        <div className="text-center py-3">
          <Spinner animation="border" variant="secondary" size="sm" />
          <span className="ms-2 text-muted small">กำลังโหลดเพิ่มเติม...</span>
        </div>
      )}

      {!hasMore && photos.length > 0 && (
        <p className="text-center text-muted small mt-2">แสดงทั้งหมด {total} รูปแล้ว</p>
      )}

      {/* ✅ Delete Confirm Modal — error แสดง inline ไม่ใช่ browser alert */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">🗑️ ยืนยันการลบรูปภาพ</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3">
          <p className="fs-5 mb-1">ต้องการลบรูปภาพนี้ใช่หรือไม่?</p>
          <small className="text-danger fw-bold">⚠️ การลบไม่สามารถกู้คืนได้</small>
          {deleteError && (
            <Alert variant="danger" className="mt-3 mb-0 text-start py-2 px-3" style={{ fontSize: 13 }}>
              {deleteError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button>
          <Button variant="danger" className="fw-bold" onClick={confirmDelete}>ลบรูปภาพ</Button>
        </Modal.Footer>
      </Modal>

      {/* Lightbox Modal */}
      <Modal show={!!lightboxPhoto} onHide={() => setLightboxPhoto(null)} size="xl" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 text-muted">
            {lightboxPhoto?.title}
            {lightboxPhoto?.event_date && (
              <Badge bg="light" text="dark" className="ms-2 fw-normal">
                📅 {new Date(lightboxPhoto.event_date + 'T12:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Badge>
            )}
            {lightboxPhoto?.faculty && (
              <Badge bg="light" text="dark" className="ms-1 fw-normal">🏛 {lightboxPhoto.faculty}</Badge>
            )}
            {lightboxPhoto?.academic_year && (
              <Badge bg="light" text="dark" className="ms-1 fw-normal">📚 ปี {lightboxPhoto.academic_year}</Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-2 text-center">
          {lightboxPhoto && (
            <img
              src={getImageUrl(lightboxPhoto.image_url)}
              alt={lightboxPhoto.title}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}
            />
          )}
          {lightboxPhoto?.description && (
            <p className="text-muted small mt-2 mb-0">{lightboxPhoto.description}</p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};