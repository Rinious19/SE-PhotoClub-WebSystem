//? Page: Event Photos Page
//@ แสดงรูปทั้งหมดในกิจกรรมนั้น — Lazy Load เมื่อ scroll ถึงด้านล่าง
//  ✅ แสดงรูปแบบ Grid, คลิกขยายได้ (lightbox)
//  ✅ ปุ่มแก้ไข/ลบ สำหรับ Admin/President
//  ✅ ลบหลายรูปพร้อมกัน (selection mode) + floating confirm bar
//  ✅ ปุ่มอัปโหลด pre-fill event/faculty/year ของ folder นี้
//  ✅ รับ faculty + academic_year + openPhotoId จาก URL query params

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Modal, Badge, Form } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { PhotoService } from '../../services/PhotoService';
import { useAuth } from '@/hooks/useAuth';
import { isAdminOrPresident } from '@/utils/roleChecker';
import { parseApiError } from '@/utils/apiError';

// ✅ แปลง image_url เป็น src URL
const BASE_URL = 'http://localhost:5000';
const getImageUrl = (imageUrl: any): string => {
  if (!imageUrl) return '';
  if (typeof imageUrl === 'string') {
    return imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
  }
  try {
    const arr = new Uint8Array(imageUrl.data || imageUrl);
    let bin = '';
    arr.forEach(b => { bin += String.fromCharCode(b); });
    return `data:image/jpeg;base64,${btoa(bin)}`;
  } catch { return ''; }
};

// ─── LazyImage ────────────────────────────────────────────────
const LazyImage: React.FC<{
  src: string; alt: string;
  onClick: () => void;
  canEdit: boolean; onEdit: () => void; onDelete: () => void;
  selectionMode: boolean; selected: boolean; onSelect: () => void;
}> = ({ src, alt, onClick, canEdit, onEdit, onDelete, selectionMode, selected, onSelect }) => {
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
      onClick={selectionMode ? onSelect : onClick}
      style={{
        position: 'relative', borderRadius: 10, overflow: 'hidden',
        background: '#f0f0f0', aspectRatio: '1', cursor: 'pointer',
        //@ กรอบแดงเมื่อเลือก
        boxShadow: selected
          ? '0 0 0 3px #dc3545, 0 2px 8px rgba(0,0,0,.15)'
          : '0 2px 8px rgba(0,0,0,.08)',
        transition: 'box-shadow .15s',
      }}
      className="photo-item"
    >
      <style>{`.photo-item:hover .photo-overlay { opacity: 1 !important; }`}</style>

      {visible ? (
        <img
          src={src} alt={alt}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: 'block', transition: 'transform .2s',
            filter: selected ? 'brightness(.72)' : 'none',
          }}
          onMouseEnter={e => { if (!selectionMode) e.currentTarget.style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
          loading="lazy"
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner animation="border" variant="secondary" size="sm" />
        </div>
      )}

      {/*@ ไอคอน ✓ วงกลมแดงเมื่อเลือก */}
      {selectionMode && selected && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 24, height: 24, borderRadius: '50%',
          background: '#dc3545', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 'bold',
          boxShadow: '0 1px 4px rgba(0,0,0,.3)',
        }}>✓</div>
      )}

      {/*@ วงกลมขาวๆ hint เมื่ออยู่ใน selection mode แต่ยังไม่เลือก */}
      {selectionMode && !selected && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(255,255,255,.6)', border: '2px solid rgba(255,255,255,.8)',
        }} />
      )}

      {/*@ ปุ่ม edit/delete เฉพาะตอนไม่อยู่ใน selection mode */}
      {canEdit && !selectionMode && (
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

  // ✅ อ่าน faculty, academic_year และ openPhotoId จาก URL query params
  const [searchParams] = useSearchParams();
  //@ ใช้ null-check แยกว่า "ไม่มี key" vs "มี key แต่ค่าว่าง"
  //  null  = ไม่ได้มาจาก folder click → ดูทุก faculty (ไม่ filter)
  //  ''    = มาจาก folder ที่ faculty=null → filter เฉพาะรูปที่ไม่มี faculty
  //  'xxx' = filter ตาม faculty นั้น
  const rawFaculty = searchParams.get('faculty');   // null = ไม่มี key, '' = มีแต่ว่าง
  const rawYear    = searchParams.get('academic_year');
  const initFaculty = rawFaculty ?? '';
  const initYear    = rawYear    ?? '';
  //@ fromFolder = navigate มาจาก folder click → ต้อง filter
  //  ใช้ ref เพื่อไม่ให้ stale closure เกิดใน fetchPage
  const fromFolderRef = useRef(rawFaculty !== null || rawYear !== null);
  //@ folderFilterActive ใช้ ref แทน state เพื่อหลีกเลี่ยง stale closure ใน useCallback
  const folderFilterActiveRef = useRef(fromFolderRef.current);
  const openPhotoId = searchParams.get('openPhotoId') ? parseInt(searchParams.get('openPhotoId')!) : null;

  const decodedName = decodeURIComponent(eventName || '');

  const [photos, setPhotos] = useState<any[]>([]);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [faculties, setFaculties] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>(initFaculty);
  const [selectedYear, setSelectedYear]       = useState<string>(initYear);

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);

  // Single delete
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  //@ Selection mode — ลบหลายรูปพร้อมกัน
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef  = useRef(false);

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
      //@ สร้าง query params โดยตรงด้วย axios
      //  folderFilterActive = true → ส่ง faculty/year ไปเสมอ ( = IS NULL, 'xxx' = ตามค่า)
      //  folderFilterActive = false → ไม่ส่ง key → backend ดูทุกรูปใน event
      const params: Record<string, any> = { page: pageNum };
      if (folderFilterActiveRef.current) {
        params.faculty       = faculty;
        params.academic_year = year;
      }
      const r = await axios.get(
        `/api/photos/by-event/${encodeURIComponent(decodedName)}`,
        { params }
      );
      const res = r.data;
      if (res.success) {
        setPhotos(prev => pageNum === 1 ? res.data : [...prev, ...res.data]);
        setHasMore(res.pagination.hasMore);
        setTotal(res.pagination.total);
      }
    } catch (err: any) { setError(parseApiError(err, 'โหลดรูปภาพไม่สำเร็จ')); }
    finally { loadingRef.current = false; setLoadingMore(false); setInitialLoading(false); }
  }, [decodedName, selectedFaculty, selectedYear]);

  useEffect(() => { fetchPage(1, initFaculty, initYear); }, []);

  //@ เปิด lightbox ตรงรูปที่ซ้ำ เมื่อ navigate มาพร้อม ?openPhotoId=
  useEffect(() => {
    if (!openPhotoId || photos.length === 0) return;
    const target = photos.find(p => p.id === openPhotoId);
    if (target) setLightboxPhoto(target);
  }, [openPhotoId, photos]);

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

  const applyFilter = (faculty: string, year: string) => {
    setSelectedFaculty(faculty);
    setSelectedYear(year);
    setPhotos([]);
    setHasMore(true);
    setInitialLoading(true);
    pageRef.current = 1;
    exitSelectionMode();
    //@ ถ้า user กด "ล้าง" → ดูทุกรูปใน event (ปิด folder filter)
    //  ถ้าเลือก faculty ใดก็ตาม → ยังคง folder filter mode
    folderFilterActiveRef.current = faculty !== '' || year !== '';
    setTimeout(() => fetchPage(1, faculty, year), 0);
  };

  // ─── Single delete ──────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const photoId = deleteTarget;
    setDeleteTarget(null);
    setDeleteError(null);
    try {
      const token = localStorage.getItem('token');
      await PhotoService.delete(photoId, token!);
      setPhotos(prev => {
        const updated = prev.filter(p => p.id !== photoId);
        if (updated.length === 0) setTimeout(() => navigate('/photos'), 0);
        return updated;
      });
      setTotal(prev => prev - 1);
    } catch (err: any) {
      setDeleteError(parseApiError(err, 'ลบรูปภาพไม่สำเร็จ'));
    }
  };

  // ─── Selection mode helpers ─────────────────────────────
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkDeleteError(null);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(photos.map(p => p.id)));
  const deselectAll = () => setSelectedIds(new Set());

  //@ ลบรูปที่เลือกทั้งหมด — ลบทีละรูปแบบ sequential
  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    setBulkDeleteError(null);
    const token = localStorage.getItem('token');
    const ids = Array.from(selectedIds);
    const failed: number[] = [];

    for (const id of ids) {
      try {
        await PhotoService.delete(id, token!);
      } catch {
        failed.push(id);
      }
    }

    const deletedIds = new Set(ids.filter(id => !failed.includes(id)));
    setPhotos(prev => {
      const updated = prev.filter(p => !deletedIds.has(p.id));
      if (updated.length === 0) setTimeout(() => navigate('/photos'), 0);
      return updated;
    });
    setTotal(prev => Math.max(0, prev - deletedIds.size));
    setBulkDeleting(false);
    setShowBulkConfirm(false);

    if (failed.length > 0) {
      setSelectedIds(new Set(failed));  //@ คงรูปที่ลบไม่ได้ไว้ให้เลือกอยู่
      setBulkDeleteError(`ลบสำเร็จ ${deletedIds.size} รูป แต่ล้มเหลว ${failed.length} รูป`);
    } else {
      exitSelectionMode();
    }
  };

  //@ navigate ไปหน้าอัปโหลด พร้อม pre-fill event/faculty/year ของ folder นี้
  const goUpload = () => {
    const params = new URLSearchParams();
    params.set('event', decodedName);
    if (selectedFaculty) params.set('faculty', selectedFaculty);
    if (selectedYear)    params.set('academic_year', selectedYear);
    navigate(`/photos/upload?${params.toString()}`);
  };

  const folderLabel = [selectedFaculty, selectedYear].filter(Boolean).join(' · ');
  const selectedCount = selectedIds.size;
  const allSelected = photos.length > 0 && selectedCount === photos.length;

  return (
    <Container className="py-5" style={{ paddingBottom: selectionMode ? 120 : undefined }}>

      {/* ─── Header ────────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" className="rounded-pill px-3"
            onClick={() => { exitSelectionMode(); navigate('/photos'); }}>
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

        {/*@ ปุ่มขวาบน — เฉพาะ admin/president */}
        {canEdit && !initialLoading && (
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {photos.length > 0 && (
              !selectionMode ? (
                <Button
                  variant="outline-danger" size="sm" className="rounded-pill px-3"
                  onClick={() => setSelectionMode(true)}
                >
                  ลบ
                </Button>
              ) : (
                <Button
                  variant={allSelected ? 'secondary' : 'outline-secondary'}
                  size="sm" className="rounded-pill px-3"
                  onClick={allSelected ? deselectAll : selectAll}
                >
                  {allSelected ? '✕ ยกเลิกทั้งหมด' : '☑️ เลือกทั้งหมด'}
                </Button>
              )
            )}

            {!selectionMode && (
              <Button variant="success" size="sm" className="rounded-pill px-3 fw-medium" onClick={goUpload}>
                อัปโหลด
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── Filter ────────────────────────────────────────── */}
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

      {/* ─── States ────────────────────────────────────────── */}
      {initialLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">กำลังโหลดรูปภาพ...</p>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {bulkDeleteError && (
        <Alert variant="warning" dismissible onClose={() => setBulkDeleteError(null)}>
          {bulkDeleteError}
        </Alert>
      )}

      {!initialLoading && photos.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="fs-2">📭</p>
          <h5>ไม่มีรูปภาพในกิจกรรมนี้</h5>
        </div>
      )}

      {/* ─── Photo Grid ────────────────────────────────────── */}
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
                selectionMode={selectionMode}
                selected={selectedIds.has(photo.id)}
                onSelect={() => toggleSelect(photo.id)}
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

      {/* ─── Floating Action Bar (Selection Mode) ──────────── */}
      {selectionMode && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#fff', borderRadius: 16, padding: '12px 24px',
          boxShadow: '0 4px 24px rgba(0,0,0,.18)',
          display: 'flex', alignItems: 'center', gap: 16,
          zIndex: 1050, minWidth: 320, maxWidth: '90vw',
          border: '1px solid #dee2e6',
        }}>
          <span className="fw-medium text-secondary" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
            {selectedCount > 0
              ? <>เลือก <strong className="text-danger">{selectedCount}</strong> รูป</>
              : 'กดเลือกรูปที่ต้องการลบ'}
          </span>
          <div className="d-flex gap-2 ms-auto">
            <Button variant="outline-secondary" size="sm" className="rounded-pill px-3"
              onClick={exitSelectionMode}>
              ยกเลิก
            </Button>
            <Button
              variant="danger" size="sm" className="rounded-pill px-3 fw-bold"
              disabled={selectedCount === 0 || bulkDeleting}
              onClick={() => setShowBulkConfirm(true)}
            >
              🗑️ ลบ {selectedCount > 0 ? `${selectedCount} รูป` : ''}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Bulk Delete Confirm Modal ──────────────────────── */}
      <Modal show={showBulkConfirm} onHide={() => !bulkDeleting && setShowBulkConfirm(false)} centered>
        <Modal.Header closeButton={!bulkDeleting} className="bg-danger text-white">
          <Modal.Title className="fw-bold">🗑️ ยืนยันการลบหลายรูป</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3">
          <p className="fs-5 mb-1">
            ต้องการลบ <strong className="text-danger">{selectedCount} รูป</strong> ใช่หรือไม่?
          </p>
          <small className="text-danger fw-bold">⚠️ การลบไม่สามารถกู้คืนได้</small>
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button variant="secondary" disabled={bulkDeleting}
            onClick={() => setShowBulkConfirm(false)}>
            ยกเลิก
          </Button>
          <Button variant="danger" className="fw-bold" onClick={confirmBulkDelete} disabled={bulkDeleting}>
            {bulkDeleting
              ? <><Spinner size="sm" className="me-1" />กำลังลบ...</>
              : `ยืนยันลบ ${selectedCount} รูป`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Single Delete Confirm Modal ───────────────────── */}
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

      {/* ─── Lightbox Modal ─────────────────────────────────── */}
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