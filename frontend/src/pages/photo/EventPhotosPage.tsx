//? Page: Event Photos Page
//@ แสดงรูปทั้งหมดในอีเว้นท์นั้น — Lazy Load เมื่อ scroll ถึงด้านล่าง
//  ✅ แสดงรูปแบบ Grid, คลิกขยายได้ (lightbox)
//  ✅ ปุ่มแก้ไข/ลบ สำหรับ Admin/President
//  ✅ แก้ไขหลายรูปพร้อมกัน (edit mode) — เปลี่ยน event/faculty/year/description
//  ✅ ลบหลายรูปพร้อมกัน (delete mode) + floating confirm bar
//  ✅ ปุ่มอัปโหลด pre-fill event/faculty/year ของ folder นี้
//  ✅ รับ faculty + academic_year + openPhotoId จาก URL query params

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Modal, Badge, Form } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { PhotoService } from '../../services/PhotoService';
import { EventService } from '../../services/EventService';
import { useAuth } from '@/hooks/useAuth';
import { isAdminOrPresident } from '@/utils/roleChecker';
import { parseApiError } from '@/utils/apiError';

const BASE_URL = 'http://localhost:5000';
const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  if (typeof imageUrl === 'string') {
    return imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
  }
  return '';
};

interface PhotoItem {
  id:            number;
  title:         string;
  event_date:    string | null;
  image_url:     string;
  thumbnail_url: string | null;
  faculty:       string | null;
  academic_year: string | null;
  description:   string | null;
}

interface EventItem {
  id:         number;
  event_name: string;
  event_date: string;
}

const FACULTIES = [
  '', 'มหาวิทยาลัย', 'คณะวิศวกรรมศาสตร์', 'คณะครุศาสตร์อุตสาหกรรม',
  'คณะวิทยาศาสตร์ประยุกต์', 'คณะเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
  'คณะศิลปศาสตร์ประยุกต์', 'คณะสถาปัตยกรรมและการออกแบบ',
  'คณะพัฒนาธุรกิจและอุตสาหกรรม', 'วิทยาลัยเทคโนโลยีอุตสาหกรรม', 'วิทยาลัยนานาชาติ',
];
const YEARS = ['2568', '2567'];

// ─── Selection mode type ──────────────────────────────────────
type ActiveMode = 'none' | 'edit' | 'delete';

// ─── LazyImage ────────────────────────────────────────────────
const LazyImage: React.FC<{
  src: string; alt: string;
  onClick: () => void;
  canEdit: boolean; onEdit: () => void; onDelete: () => void;
  selectionMode: boolean; selected: boolean; onSelect: () => void;
  selectionColor: string;
}> = ({ src, alt, onClick, canEdit, onEdit, onDelete, selectionMode, selected, onSelect, selectionColor }) => {
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
        boxShadow: selected
          ? `0 0 0 3px ${selectionColor}, 0 2px 8px rgba(0,0,0,.15)`
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

      {selectionMode && selected && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 24, height: 24, borderRadius: '50%',
          background: selectionColor, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 'bold',
          boxShadow: '0 1px 4px rgba(0,0,0,.3)',
        }}>✓</div>
      )}

      {selectionMode && !selected && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(255,255,255,.6)', border: '2px solid rgba(255,255,255,.8)',
        }} />
      )}

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
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = isAdminOrPresident(user);

  const [searchParams] = useSearchParams();
  const openPhotoId = searchParams.get('openPhotoId') ? parseInt(searchParams.get('openPhotoId')!) : null;

  const parsedEventId = parseInt(eventId || '', 10);
  //* context — เก็บ eventId ใน ref เพื่อให้ fetchPage เข้าถึงได้เสมอโดยไม่ต้องอยู่ใน dependency
  const eventIdRef = useRef(parsedEventId);
  useEffect(() => { eventIdRef.current = parsedEventId; }, [parsedEventId]);

  //? โหลดชื่อ event จาก API เพื่อแสดงใน header
  const [eventName, setEventName] = useState<string>('');
  useEffect(() => {
    EventService.getAll()
      .then(res => {
        const ev = (res.data || []).find((e: { id: number; event_name: string }) => e.id === parsedEventId);
        if (ev) setEventName(ev.event_name);
      })
      .catch(() => {});
  }, [parsedEventId]);

  const [photos, setPhotos]   = useState<PhotoItem[]>([]);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  // Single delete
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ─── Active mode ──────────────────────────────────────────
  const [activeMode, setActiveMode] = useState<ActiveMode>('none');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Delete mode
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Edit mode
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditing, setBulkEditing] = useState(false);
  const [bulkEditError, setBulkEditError] = useState<string | null>(null);
  const [events, setEvents]   = useState<EventItem[]>([]);
  const [editForm, setEditForm] = useState({
    event_name: '',
    faculty: '',
    academic_year: '',
    description: '',   // ✅ เพิ่ม description
  });
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  // Sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef  = useRef(false);

  // โหลด events สำหรับ bulk edit dropdown
  useEffect(() => {
    EventService.getAll()
      .then(res => setEvents(res.data || []))
      .catch(() => {});
  }, []);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node))
        setEditDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchPage = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    //! ตรวจสอบ eventId ก่อน fetch — ถ้าเป็น NaN ให้หยุดทันที
    if (isNaN(eventIdRef.current)) return;
    loadingRef.current = true;
    try {
      //* context — ใช้ eventIdRef แทน parsedEventId เพื่อหลีกเลี่ยง NaN จาก stale closure
      const r = await axios.get(`/api/photos/event/${eventIdRef.current}`, { params: { page: pageNum } });
      const res = r.data;
      if (res.success) {
        setPhotos(prev => pageNum === 1 ? res.data as PhotoItem[] : [...prev, ...res.data as PhotoItem[]]);
        setHasMore(res.pagination.hasMore);
        setTotal(res.pagination.total);
      }
    } catch (err: unknown) {
      setError(parseApiError(err, 'โหลดรูปภาพไม่สำเร็จ'));
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, []);

  //? รอให้ parsedEventId พร้อมก่อนค่อย fetch — ป้องกัน NaN
  useEffect(() => {
    if (!isNaN(parsedEventId)) {
      eventIdRef.current = parsedEventId;
      fetchPage(1);
    }
  }, [parsedEventId, fetchPage]);

  useEffect(() => {
    if (!openPhotoId || photos.length === 0) return;
    const target = photos.find(p => p.id === openPhotoId);
    if (target) setLightboxPhoto(target);
  }, [openPhotoId, photos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        //! ไม่ให้ IntersectionObserver ยิง fetchPage ขณะที่ initialLoading ยังทำงานอยู่
        if (entry.isIntersecting && hasMore && !loadingRef.current && !initialLoading) {
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
  }, [hasMore, fetchPage, initialLoading]);

  // ─── Selection helpers ──────────────────────────────────
  const exitMode = () => {
    setActiveMode('none');
    setSelectedIds(new Set());
    setBulkDeleteError(null);
    setBulkEditError(null);
  };

  const enterMode = (mode: ActiveMode) => {
    setActiveMode(mode);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: number) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    return next;
  });
};

  const selectAll = () => setSelectedIds(new Set(photos.map(p => p.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const selectedCount = selectedIds.size;
  const allSelected = photos.length > 0 && selectedCount === photos.length;
  const selectionMode = activeMode !== 'none';

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
    } catch (err: unknown) {
      setDeleteError(parseApiError(err, 'ลบรูปภาพไม่สำเร็จ'));
    }
  };

  // ─── Bulk delete ────────────────────────────────────────
  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    setBulkDeleteError(null);
    const token = localStorage.getItem('token');
    const ids = Array.from(selectedIds);
    const failed: number[] = [];

    for (const id of ids) {
      try { await PhotoService.delete(id, token!); }
      catch { failed.push(id); }
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
      setSelectedIds(new Set(failed));
      setBulkDeleteError(`ลบสำเร็จ ${deletedIds.size} รูป แต่ล้มเหลว ${failed.length} รูป`);
    } else {
      exitMode();
    }
  };

  // ─── Bulk edit ──────────────────────────────────────────
  const openBulkEditModal = () => {
    setEditForm({
      event_name: eventName,
      faculty: '',
      academic_year: '',
      description: '',
    });
    setBulkEditError(null);
    setShowBulkEditModal(true);
  };

  const confirmBulkEdit = async () => {
    if (selectedIds.size === 0) return;
    //! ต้องหา event_id จาก event ที่เลือก — ถ้าไม่ส่ง event_id รูปจะไม่ถูกย้าย gallery
    const targetEvent = events.find(ev => ev.event_name === editForm.event_name);
    if (!targetEvent) {
      setBulkEditError('กรุณาเลือกอีเว้นท์จากรายการ');
      return;
    }

    setBulkEditing(true);
    setBulkEditError(null);
    const token = localStorage.getItem('token');
    const ids = Array.from(selectedIds);
    const failed: number[] = [];

    for (const id of ids) {
      try {
        const data = new FormData();
        data.append('title',         editForm.event_name);
        //* context — ส่ง event_id เพื่อให้ backend อัปเดต FK และย้ายรูปไป gallery ใหม่จริงๆ
        data.append('event_id',      String(targetEvent.id));
        data.append('event_date',    targetEvent.event_date.split('T')[0]);
        data.append('faculty',       editForm.faculty);
        data.append('academic_year', editForm.academic_year);
        data.append('description',   editForm.description);
        await PhotoService.update(id, data, token!);
      } catch {
        failed.push(id);
      }
    }

    setBulkEditing(false);
    setShowBulkEditModal(false);

    if (failed.length > 0) {
      setBulkEditError(`แก้ไขสำเร็จ ${ids.length - failed.length} รูป แต่ล้มเหลว ${failed.length} รูป`);
      setSelectedIds(new Set(failed));
    } else {
      exitMode();
      // reload หน้าใหม่เพื่อให้ข้อมูลอัปเดต
      setInitialLoading(true);
      setPhotos([]);
      pageRef.current = 1;
      setTimeout(() => fetchPage(1), 0);
    }
  };

  const goUpload = () => {
    const params = new URLSearchParams();
    if (eventName) params.set('event', eventName);
    navigate(`/photos/upload?${params.toString()}`);
  };

  const filteredEvents = events.filter(ev =>
    ev.event_name.toLowerCase().includes(editForm.event_name.toLowerCase())
  );

  return (
    <Container className="py-5" style={{ paddingBottom: selectionMode ? 120 : undefined }}>

      {/* ─── Header ────────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" className="rounded-pill px-3"
            onClick={() => { exitMode(); navigate('/photos'); }}>
            ← กลับ
          </Button>
          <div>
            <h2 className="fw-bold mb-0">📂 {eventName || '...'}</h2>
            {!initialLoading && (
              <p className="text-muted small mb-0">{total} รูปภาพ</p>
            )}
          </div>
        </div>

        {canEdit && !initialLoading && (
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {photos.length > 0 && (
              activeMode === 'none' ? (
                <>
                  {/* ลบ */}
                  <Button variant="outline-danger" size="sm" className="rounded-pill px-3"
                    onClick={() => enterMode('delete')}>
                    ลบ
                  </Button>
                  {/*  แก้ไข — ระหว่าง ลบ กับ อัปโหลด */}
                  <Button variant="outline-warning" size="sm" className="rounded-pill px-3"
                    onClick={() => enterMode('edit')}>
                     แก้ไข
                  </Button>
                </>
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

            {activeMode === 'none' && (
              <Button variant="success" size="sm" className="rounded-pill px-3 fw-medium" onClick={goUpload}>
                อัปโหลด
              </Button>
            )}
          </div>
        )}
      </div>

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

      {bulkEditError && (
        <Alert variant="warning" dismissible onClose={() => setBulkEditError(null)}>
          {bulkEditError}
        </Alert>
      )}

      {!initialLoading && photos.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="fs-2">📭</p>
          <h5>ไม่มีรูปภาพในอีเว้นท์นี้</h5>
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
                selectionColor={activeMode === 'edit' ? '#f0a500' : '#dc3545'}
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
        <p className="text-center text-muted small mt-2">แสดงทั้งหมด {total} รูป</p>
      )}

      {/* ─── Floating Action Bar ────────────────────────────── */}
      {selectionMode && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#fff', borderRadius: 16, padding: '12px 24px',
          boxShadow: '0 4px 24px rgba(0,0,0,.18)',
          display: 'flex', alignItems: 'center', gap: 16,
          zIndex: 1050, minWidth: 340, maxWidth: '90vw',
          border: `2px solid ${activeMode === 'edit' ? '#ffc107' : '#f8d7da'}`,
        }}>
          <span className="fw-medium text-secondary" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
            {selectedCount > 0
              ? <>เลือก <strong style={{ color: activeMode === 'edit' ? '#f0a500' : '#dc3545' }}>{selectedCount}</strong> รูป</>
              : `กดเลือกรูปที่ต้องการ${activeMode === 'edit' ? 'แก้ไข' : 'ลบ'}`}
          </span>
          <div className="d-flex gap-2 ms-auto">
            <Button variant="outline-secondary" size="sm" className="rounded-pill px-3"
              onClick={exitMode}>
              ยกเลิก
            </Button>
            {activeMode === 'delete' && (
              <Button variant="danger" size="sm" className="rounded-pill px-3 fw-bold"
                disabled={selectedCount === 0 || bulkDeleting}
                onClick={() => setShowBulkConfirm(true)}>
                 ลบ {selectedCount > 0 ? `${selectedCount} รูป` : ''}
              </Button>
            )}
            {activeMode === 'edit' && (
              <Button variant="warning" size="sm" className="rounded-pill px-3 fw-bold"
                disabled={selectedCount === 0}
                onClick={openBulkEditModal}>
                 แก้ไข {selectedCount > 0 ? `${selectedCount} รูป` : ''}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ─── Bulk Edit Modal ────────────────────────────────── */}
      <Modal show={showBulkEditModal} onHide={() => !bulkEditing && setShowBulkEditModal(false)} centered>
        <Modal.Header closeButton={!bulkEditing} className="bg-warning">
          <Modal.Title className="fw-bold"> แก้ไข {selectedCount} รูปพร้อมกัน</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          <p className="text-muted small mb-3">ข้อมูลด้านล่างจะถูกนำไปอัปเดตรูปที่เลือกทั้งหมด</p>

          {/* Event dropdown */}
          <Form.Group className="mb-3 position-relative" ref={editDropdownRef}>
            <Form.Label className="fw-bold">อีเว้นท์</Form.Label>
            <div className="input-group">
              <Form.Control
                type="text" placeholder="ค้นหาชื่ออีเว้นท์..."
                value={editForm.event_name}
                onChange={e => { setEditForm(f => ({ ...f, event_name: e.target.value })); setEditDropdownOpen(true); }}
                onFocus={() => setEditDropdownOpen(true)}
              />
              <Button variant="outline-secondary" onClick={() => setEditDropdownOpen(o => !o)}>
                {editDropdownOpen ? '▲' : '▼'}
              </Button>
            </div>
            {editDropdownOpen && filteredEvents.length > 0 && (
              <div className="position-absolute w-100 shadow-lg border rounded bg-white mt-1"
                style={{ zIndex: 1060, maxHeight: 200, overflowY: 'auto' }}>
                {filteredEvents.map(ev => (
                  <div key={ev.id}
                    className="px-3 py-2 border-bottom"
                    style={{ cursor: 'pointer' }}
                    onMouseOver={e => (e.currentTarget.style.background = '#fff9e6')}
                    onMouseOut={e => (e.currentTarget.style.background = '#fff')}
                    onClick={() => {
                      setEditForm(f => ({ ...f, event_name: ev.event_name }));
                      setEditDropdownOpen(false);
                    }}>
                    <span className="fw-bold text-primary">{ev.event_name}</span>
                    <span className="text-muted small ms-2">{ev.event_date?.split('T')[0]}</span>
                  </div>
                ))}
              </div>
            )}
            {editForm.event_name && !events.find(ev => ev.event_name === editForm.event_name) && (
              <Form.Text className="text-danger">* โปรดเลือกจากอีเว้นท์ที่มีอยู่</Form.Text>
            )}
          </Form.Group>

          {/* คณะ + ปีการศึกษา */}
          <Row className="mb-3">
            <Col md={7}>
              <Form.Label className="fw-bold">คณะ</Form.Label>
              <Form.Select value={editForm.faculty}
                onChange={e => setEditForm(f => ({ ...f, faculty: e.target.value }))}>
                <option value="">-- ไม่ระบุ --</option>
                {FACULTIES.filter(Boolean).map(f => <option key={f}>{f}</option>)}
              </Form.Select>
            </Col>
            <Col md={5}>
              <Form.Label className="fw-bold">ปีการศึกษา</Form.Label>
              <Form.Select value={editForm.academic_year}
                onChange={e => setEditForm(f => ({ ...f, academic_year: e.target.value }))}>
                <option value="">-- ไม่ระบุ --</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </Form.Select>
            </Col>
          </Row>

          {/* ✅ คำอธิบายเพิ่มเติม */}
          <Form.Group className="mb-2">
            <Form.Label className="fw-bold">คำอธิบายเพิ่มเติม</Form.Label>
            <Form.Control
              as="textarea" rows={3}
              placeholder="(ไม่บังคับ) — จะถูกใช้แทนคำอธิบายเดิมของทุกรูปที่เลือก"
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            />
          </Form.Group>

          {bulkEditError && (
            <Alert variant="danger" className="mt-3 mb-0 py-2 px-3" style={{ fontSize: 13 }}>
              {bulkEditError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button variant="secondary" disabled={bulkEditing}
            onClick={() => setShowBulkEditModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="warning" className="fw-bold" onClick={confirmBulkEdit}
            disabled={bulkEditing || !events.find(ev => ev.event_name === editForm.event_name)}>
            {bulkEditing
              ? <><Spinner size="sm" className="me-1" />กำลังบันทึก...</>
              : `✅ ยืนยันแก้ไข ${selectedCount} รูป`}
          </Button>
        </Modal.Footer>
      </Modal>

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