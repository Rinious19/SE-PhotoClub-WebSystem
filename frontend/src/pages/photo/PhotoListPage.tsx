//? Page: Photo List Page (Gallery)
//@ แกลเลอรี่รูปภาพ — ค้นหาด้วยชื่อ Event และกรองวันที่ (วันเดียว หรือ ช่วงวันที่)

import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Spinner, Alert, Form, InputGroup, Button, Badge } from 'react-bootstrap';
import { PhotoCard } from '../../components/photo/PhotoCard';
import { PhotoService } from '../../services/PhotoService';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DateRangeFilter, emptyDateFilter, matchesDateFilter } from '@/components/common/DateRangeFilter';
import type { DateFilter } from '@/components/common/DateRangeFilter';

export const PhotoListPage: React.FC = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const canUpload = user?.role === 'ADMIN' || user?.role === 'CLUB_PRESIDENT';

  // ✅ Search states
  const [searchName, setSearchName] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>(emptyDateFilter());

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await PhotoService.getAll();
      if (response.success) setPhotos(response.data);
      else setError('ไม่สามารถดึงข้อมูลรูปภาพได้');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPhotos(); }, []);

  // ✅ Filter รูปตามชื่อ Event และวันที่
  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      const nameMatch = (photo.title || '').toLowerCase().includes(searchName.toLowerCase());
      const dateMatch = matchesDateFilter(photo.event_date || '', dateFilter);
      return nameMatch && dateMatch;
    });
  }, [photos, searchName, dateFilter]);

  const hasFilter = searchName !== '' || dateFilter.from !== '' || dateFilter.to !== '';

  const clearAll = () => {
    setSearchName('');
    setDateFilter(emptyDateFilter());
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">
          แกลเลอรี่
          <span className="text-secondary fs-5 fw-normal ms-2">
            ({hasFilter ? `${filteredPhotos.length} / ${photos.length}` : photos.length})
          </span>
        </h2>
        {canUpload && (
          <Link to="/photos/upload" className="btn btn-success px-4 fw-bold shadow-sm rounded-pill">
            + อัปโหลดรูปภาพ
          </Link>
        )}
      </div>

      {/* ✅ Search + DateRangeFilter */}
      {!loading && !error && photos.length > 0 && (
        <div className="bg-light rounded-4 p-3 mb-4">
          <Row className="g-3 align-items-start">
            {/* ค้นหาชื่อ Event */}
            <Col md={5}>
              <Form.Label className="fw-medium small text-secondary mb-1">ชื่อกิจกรรม (Event)</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">🔍</InputGroup.Text>
                <Form.Control
                  className="border-start-0"
                  placeholder="ค้นหาตามชื่อกิจกรรม..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                {searchName && (
                  <Button variant="outline-secondary" onClick={() => setSearchName('')}>✕</Button>
                )}
              </InputGroup>
            </Col>

            {/* กรองวันที่ */}
            <Col md={5}>
              <Form.Label className="fw-medium small text-secondary mb-1">กรองตามวันที่จัดกิจกรรม</Form.Label>
              <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
            </Col>

            {/* ปุ่มล้างทั้งหมด */}
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="outline-danger" className="w-100 my-4"
                onClick={clearAll} disabled={!hasFilter}
              >
                ล้างทั้งหมด
              </Button>
            </Col>
          </Row>

          {hasFilter && (
            <div className="mt-2 pt-2 border-top">
              <small className="text-muted">
                พบ <strong className="text-primary">{filteredPhotos.length}</strong> รูป จากทั้งหมด {photos.length} รูป
              </small>
              {searchName && (
                <Badge bg="primary" className="ms-2 rounded-pill">ชื่อ: {searchName}</Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">กำลังโหลดรูปภาพ...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : photos.length === 0 ? (
        <div className="text-center text-secondary py-5">
          <p className="fs-3">📷</p>
          <h5>ยังไม่มีรูปภาพในระบบ</h5>
          <p>รอผู้ใช้อัปโหลดรูปภาพใหม่เร็วๆ นี้</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center text-secondary py-5">
          <p className="fs-3">🔍</p>
          <h5>ไม่พบรูปภาพที่ตรงกับการค้นหา</h5>
          <p className="small">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>
          <Button variant="outline-primary" size="sm" onClick={clearAll}>ล้างการค้นหา</Button>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {filteredPhotos.map((photo) => (
            <Col key={photo.id}>
              <PhotoCard photo={photo} onPhotoDeleted={fetchPhotos} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};