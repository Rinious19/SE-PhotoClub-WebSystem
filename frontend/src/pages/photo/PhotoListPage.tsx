//? Page: Photo List Page (Gallery — Folder View)
//@ แสดงกิจกรรมเป็น Folder แต่ละอันมี preview 3 รูป
//  ✅ Lazy Load folders เมื่อ scroll ถึงด้านล่าง
//  ✅ ค้นหาด้วยชื่อ Event และวันที่

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { PhotoService } from '../../services/PhotoService';
import { useAuth } from '@/hooks/useAuth';
import { DateRangeFilter, emptyDateFilter, matchesDateFilter } from '@/components/common/DateRangeFilter';
import type { DateFilter } from '@/components/common/DateRangeFilter';
import { parseApiError } from '@/utils/apiError';

// ✅ แปลง image_url เป็น src URL โดยตรง (ไม่ต้อง base64 อีกต่อไป)
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

// FolderCard component
const FolderCard: React.FC<{ folder: any; onClick: () => void }> = ({ folder, onClick }) => {
  const previews = folder.previews || [];

  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'transform .18s, box-shadow .18s' }}
      className="h-100"
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 28px rgba(0,0,0,.13)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      <div style={{ borderRadius: 14, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,.08)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
        {/* Preview grid */}
        <div style={{ position: 'relative', height: 160, background: '#f8f9fa', flexShrink: 0, borderRadius: '14px 14px 0 0', overflow: 'hidden', display: 'grid', gridTemplateColumns: previews.length >= 3 ? '2fr 1fr' : previews.length === 2 ? '1fr 1fr' : '1fr', gridTemplateRows: previews.length >= 3 ? '1fr 1fr' : '1fr', gap: 2, padding: 2 }}>
          {previews.length === 0 && (
            <div style={{ gridColumn: '1/-1', gridRow: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📁</div>
          )}
          {previews.length === 1 && (
            <img src={getImageUrl(previews[0].thumbnail_url || previews[0].image_url)} alt="" style={{ gridColumn: '1/-1', gridRow: '1/-1', width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
          )}
          {previews.length === 2 && (
            <>
              <img src={getImageUrl(previews[0].thumbnail_url || previews[0].image_url)} alt="" style={{ gridColumn: '1', gridRow: '1 / -1', width: '100%', height: '100%', objectFit: 'cover' }} />
              <img src={getImageUrl(previews[1].thumbnail_url || previews[1].image_url)} alt="" style={{ gridColumn: '2', gridRow: '1 / -1', width: '100%', height: '100%', objectFit: 'cover' }} />
            </>
          )}
          {previews.length >= 3 && (
            <>
              <img src={getImageUrl(previews[0].thumbnail_url || previews[0].image_url)} alt="" style={{ gridColumn: '1', gridRow: '1/-1', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px 0 0 8px' }} />
              <img src={getImageUrl(previews[1].thumbnail_url || previews[1].image_url)} alt="" style={{ gridColumn: '2', gridRow: '1', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0 8px 0 0' }} />
              <img src={getImageUrl(previews[2].thumbnail_url || previews[2].image_url)} alt="" style={{ gridColumn: '2', gridRow: '2', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0 0 8px 0' }} />
            </>
          )}
          {/* Count badge */}
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            {folder.photo_count} รูป
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 14px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            📂 {folder.event_name}
          </div>
          {folder.event_date && (
            <div style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>
              📅 {new Date(folder.event_date + 'T12:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
          {(folder.faculty || folder.academic_year) && (
            <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {folder.faculty && (
                <span style={{ fontSize: 11, background: '#e8f4fd', color: '#1a6fa8', borderRadius: 20, padding: '2px 8px', fontWeight: 500 }}>
                  🏛 {folder.faculty}
                </span>
              )}
              {folder.academic_year && (
                <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', borderRadius: 20, padding: '2px 8px', fontWeight: 500 }}>
                  📚 ปี {folder.academic_year}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────
export const PhotoListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUpload = user?.role === 'ADMIN' || user?.role === 'CLUB_PRESIDENT';

  const [folders, setFolders] = useState<any[]>([]);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalFolders, setTotalFolders] = useState(0);

  // Search
  const [searchName, setSearchName] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>(emptyDateFilter());
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Sentinel ref สำหรับ IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const res = await PhotoService.getGrouped(pageNum);
      if (res.success) {
        setFolders(prev => pageNum === 1 ? res.data : [...prev, ...res.data]);
        setHasMore(res.pagination.hasMore);
        setTotalFolders(res.pagination.total);
      }
    } catch (err: any) { setError(parseApiError(err, 'โหลดข้อมูลแกลเลอรี่ไม่สำเร็จ')); }
    finally { loadingRef.current = false; setLoadingMore(false); setInitialLoading(false); }
  }, []);

  // Load แรก
  useEffect(() => { fetchPage(1); }, [fetchPage]);

  // IntersectionObserver — load more เมื่อ scroll ถึง sentinel
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
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

  // Filter ฝั่ง client
  const filteredFolders = useMemo(() => {
    return folders.filter(f => {
      const nameMatch    = f.event_name.toLowerCase().includes(searchName.toLowerCase());
      const dateMatch    = matchesDateFilter(f.event_date || '', dateFilter);
      const facultyMatch = !filterFaculty || f.faculty === filterFaculty;
      const yearMatch    = !filterYear    || (f.academic_year || '').includes(filterYear);
      return nameMatch && dateMatch && facultyMatch && yearMatch;
    });
  }, [folders, searchName, dateFilter, filterFaculty, filterYear]);

  const hasFilter = searchName !== '' || dateFilter.from !== '' || dateFilter.to !== '' || filterFaculty !== '' || filterYear !== '';
  const clearAll = () => { setSearchName(''); setDateFilter(emptyDateFilter()); setFilterFaculty(''); setFilterYear(''); };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">
            แกลเลอรี่
            {!initialLoading && (
              <span className="text-secondary fs-5 fw-normal ms-2">
                ({hasFilter ? `${filteredFolders.length} / ` : ''}{totalFolders} กิจกรรม)
              </span>
            )}
          </h2>
        </div>
        {canUpload && (
          <Link to="/photos/upload" className="btn btn-success px-4 fw-bold shadow-sm rounded-pill">
            + อัปโหลดรูปภาพ
          </Link>
        )}
      </div>

      {/* Search + Filter */}
      {!initialLoading && !error && folders.length > 0 && (
        <div className="bg-light rounded-4 p-3 mb-4">
          <Row className="g-3 align-items-start">
            <Col md={4}>
              <Form.Label className="fw-medium small text-secondary mb-1">ชื่อกิจกรรม (Event)</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">🔍</InputGroup.Text>
                <Form.Control className="border-start-0" placeholder="ค้นหาตามชื่อกิจกรรม..."
                  value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                {searchName && <Button variant="outline-secondary" onClick={() => setSearchName('')}>✕</Button>}
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label className="fw-medium small text-secondary mb-1">กรองตามวันที่จัดกิจกรรม</Form.Label>
              <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
            </Col>
            <Col md={3}>
              <Form.Label className="fw-medium small text-secondary mb-1">คณะ / ปีการศึกษา</Form.Label>
              <Row className="g-2">
                <Col xs={7}>
                  <Form.Select size="sm" value={filterFaculty} onChange={(e) => setFilterFaculty(e.target.value)}>
                    <option value="">-- ทุกคณะ --</option>
                    <option>มหาวิทยาลัย</option>
                    <option>คณะวิศวกรรมศาสตร์</option>
                    <option>ครุศาสตร์อุตสาหกรรม</option>
                    <option>วิทยาศาสตร์ประยุกต์</option>
                    <option>เทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล</option>
                    <option>ศิลปศาสตร์ประยุกต์</option>
                    <option>สถาปัตยกรรมและการออกแบบ</option>
                    <option>พัฒนาธุรกิจและอุตสาหกรรม</option>
                    <option>วิทยาลัยเทคโนโลยีอุตสาหกรรม</option>
                    <option>วิทยาลัยนานาชาติ</option>
                  </Form.Select>
                </Col>
                <Col xs={5}>
                  <Form.Control size="sm" placeholder="ปี เช่น 2567" maxLength={4}
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                </Col>
              </Row>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button variant="outline-danger" className="w-100" onClick={clearAll} disabled={!hasFilter}>ล้างทั้งหมด</Button>
            </Col>
          </Row>
          {hasFilter && (
            <div className="mt-2 pt-2 border-top">
              <small className="text-muted">พบ <strong className="text-primary">{filteredFolders.length}</strong> กิจกรรม</small>
            </div>
          )}
        </div>
      )}

      {/* Initial loading */}
      {initialLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">กำลังโหลด...</p>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Empty state */}
      {!initialLoading && !error && folders.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="fs-2">📭</p>
          <h5>ยังไม่มีรูปภาพในระบบ</h5>
        </div>
      )}

      {/* No search result */}
      {!initialLoading && !error && folders.length > 0 && filteredFolders.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="fs-2">🔍</p>
          <h5>ไม่พบกิจกรรมที่ตรงกับการค้นหา</h5>
          <Button variant="outline-primary" size="sm" onClick={clearAll}>ล้างการค้นหา</Button>
        </div>
      )}

      {/* Folder Grid */}
      {filteredFolders.length > 0 && (
        <Row xs={2} sm={3} md={4} lg={4} className="g-3">
          {filteredFolders.map((folder, i) => (
            <Col key={`${folder.event_name}-${i}`}>
              <FolderCard folder={folder} onClick={() => navigate(`/photos/event/${encodeURIComponent(folder.event_name)}`)} />
            </Col>
          ))}
        </Row>
      )}

      {/* ✅ Sentinel div — IntersectionObserver จะ trigger load more ตรงนี้ */}
      <div ref={sentinelRef} style={{ height: 40, marginTop: 24 }} />

      {loadingMore && (
        <div className="text-center py-3">
          <Spinner animation="border" variant="secondary" size="sm" />
          <span className="ms-2 text-muted small">กำลังโหลดเพิ่มเติม...</span>
        </div>
      )}

      {!hasMore && folders.length > 0 && !hasFilter && (
        <p className="text-center text-muted small mt-2">แสดงทั้งหมด {totalFolders} กิจกรรมแล้ว</p>
      )}
    </Container>
  );
};