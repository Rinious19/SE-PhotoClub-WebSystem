//? Page: ActivitiesPage
//@ หน้ากิจกรรมโหวตหลัก — ทุกคนดูได้ รวม Guest
//  แบ่งเป็น 2 ส่วน:
//    1. กิจกรรมที่กำลังดำเนินการ (ACTIVE + UPCOMING)
//    2. กิจกรรมที่สิ้นสุดไปแล้ว (ENDED)
//  มี Filter Bar: ชื่อ / วันที่ / ประเภท / สถานะ

import React, { useState, useMemo } from 'react';
import {
  Container, Row, Col, Form, InputGroup,
  Button, Spinner, Alert, Badge,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ActivityCard } from '@/components/activity/ActivityCard';
import { useActivities } from '@/hooks/useActivities';
import { DateRangeFilter, emptyDateFilter, matchesDateFilter } from '@/components/common/DateRangeFilter';
import type { DateFilter } from '@/components/common/DateRangeFilter';
import { useAuth } from '@/hooks/useAuth';
import { isAdminOrPresident } from '@/utils/roleChecker';

//@ หมวดหมู่กิจกรรม — ตรงกับ category field ใน DB
const CATEGORIES = [
  '',
  'มหาวิทยาลัย',
  'คณะวิศวกรรมศาสตร์',
  'คณะครุศาสตร์อุตสาหกรรม',
  'คณะวิทยาศาสตร์ประยุกต์',
  'คณะเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
  'คณะศิลปศาสตร์ประยุกต์',
  'คณะสถาปัตยกรรมและการออกแบบ',
  'คณะพัฒนาธุรกิจและอุตสาหกรรม',
  'วิทยาลัยเทคโนโลยีอุตสาหกรรม',
  'วิทยาลัยนานาชาติ',
];

export const ActivitiesPage: React.FC = () => {
  const { user } = useAuth();
  // ตรวจสอบสิทธิ์สร้างกิจกรรม (เฉพาะ CLUB_PRESIDENT)
  const canCreate = user?.role === 'CLUB_PRESIDENT';
  const canManage = isAdminOrPresident(user);

  // ===== Filter State =====
  const [keyword,    setKeyword]    = useState('');
  const [category,   setCategory]   = useState('');
  const [statusTab,  setStatusTab]  = useState<'all' | 'active' | 'ended'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>(emptyDateFilter());

  //* ดึงกิจกรรมทั้งหมดจาก API (ไม่กรอง status ที่ API ให้ filter ฝั่ง client แทน)
  const { activities, loading, error, refetch } = useActivities({
    keyword:  keyword  || undefined,
    category: category || undefined,
  });

  //@ Filter ฝั่ง client — แบ่ง active/ended และกรองวันที่
  const { activeList, endedList } = useMemo(() => {
    // กรองตามวันที่
    const dateFiltered = activities.filter((a) =>
      matchesDateFilter(a.start_at?.split('T')[0] ?? '', dateFilter)
    );

    const active = dateFiltered.filter(
      (a) => a.status === 'ACTIVE' || a.status === 'UPCOMING'
    );
    const ended  = dateFiltered.filter((a) => a.status === 'ENDED');

    return { activeList: active, endedList: ended };
  }, [activities, dateFilter]);

  // กรองตาม tab ที่เลือก
  const displayActive = statusTab !== 'ended'  ? activeList : [];
  const displayEnded  = statusTab !== 'active' ? endedList  : [];

  const hasFilter = keyword !== '' || category !== '' || dateFilter.from !== '' || dateFilter.to !== '';
  const clearAll  = () => {
    setKeyword('');
    setCategory('');
    setDateFilter(emptyDateFilter());
    setStatusTab('all');
  };

  return (
    <Container className="py-5">
      {/* ===== Header ===== */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">🏆 กิจกรรมโหวตภาพถ่าย</h2>
          <p className="text-muted mb-0">
            เลือกภาพถ่ายที่คุณชื่นชอบ — 1 คน 1 โหวต ต่อ 1 กิจกรรม
          </p>
        </div>
        {/* ปุ่มสร้างกิจกรรม — แสดงเฉพาะ CLUB_PRESIDENT */}
        {canCreate && (
          <Link to="/activities/create" className="btn btn-success rounded-pill px-4 fw-bold">
            + สร้างกิจกรรม
          </Link>
        )}
      </div>

      {/* ===== Filter Bar ===== */}
      <div className="bg-light rounded-4 p-3 mb-4">
        <Row className="g-3 align-items-end">
          {/* ค้นหาชื่อ */}
          <Col md={4}>
            <Form.Label className="fw-medium small text-secondary mb-1">
              ชื่อกิจกรรม
            </Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">🔍</InputGroup.Text>
              <Form.Control
                className="border-start-0"
                placeholder="ค้นหาชื่อกิจกรรม..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              {keyword && (
                <Button variant="outline-secondary" onClick={() => setKeyword('')}>✕</Button>
              )}
            </InputGroup>
          </Col>

          {/* กรองวันที่ */}
          <Col md={3}>
            <Form.Label className="fw-medium small text-secondary mb-1">
              วันที่จัดกิจกรรม
            </Form.Label>
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          </Col>

          {/* ประเภทกิจกรรม */}
          <Col md={3}>
            <Form.Label className="fw-medium small text-secondary mb-1">
              ประเภทกิจกรรม
            </Form.Label>
            <Form.Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              size="sm"
            >
              <option value="">-- ทุกประเภท --</option>
              {CATEGORIES.filter(Boolean).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Form.Select>
          </Col>

          {/* ล้างทั้งหมด */}
          <Col md={2}>
            <Button
              variant="outline-danger"
              className="w-100"
              style={{ fontSize: '0.85rem' }}
              onClick={clearAll}
              disabled={!hasFilter && statusTab === 'all'}
            >
              ล้างทั้งหมด
            </Button>
          </Col>
        </Row>

        {/* Tab กรองสถานะ */}
        <div className="d-flex gap-2 mt-3">
          {[
            { key: 'all',    label: 'ทั้งหมด',              bg: 'dark'      },
            { key: 'active', label: '🟢 กำลังดำเนินการ',    bg: 'success'   },
            { key: 'ended',  label: '⚫ สิ้นสุดแล้ว',        bg: 'secondary' },
          ].map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={statusTab === tab.key ? tab.bg : `outline-${tab.bg}`}
              className="rounded-pill px-3"
              onClick={() => setStatusTab(tab.key as typeof statusTab)}
            >
              {tab.label}
              {tab.key === 'active' && activeList.length > 0 && (
                <Badge bg="light" text="dark" className="ms-1 rounded-pill">{activeList.length}</Badge>
              )}
              {tab.key === 'ended' && endedList.length > 0 && (
                <Badge bg="light" text="dark" className="ms-1 rounded-pill">{endedList.length}</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* ===== Loading / Error ===== */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">กำลังโหลดกิจกรรม...</p>
        </div>
      )}
      {!loading && error && (
        <Alert variant="danger">
          {error}
          <Button variant="link" size="sm" className="ms-2" onClick={refetch}>
            ลองใหม่
          </Button>
        </Alert>
      )}

      {/* ===== ส่วนที่ 1: กิจกรรมที่กำลังดำเนินการ ===== */}
      {!loading && !error && statusTab !== 'ended' && (
        <section className="mb-5">
          <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <span>🟢 กำลังดำเนินการ</span>
            <Badge bg="success" className="rounded-pill">{displayActive.length}</Badge>
          </h4>

          {displayActive.length === 0 ? (
            <div className="text-center py-4 text-muted bg-light rounded-4">
              <p className="fs-4 mb-1">📭</p>
              <p className="mb-0">ไม่มีกิจกรรมที่กำลังดำเนินการในขณะนี้</p>
            </div>
          ) : (
            <Row xs={1} sm={2} md={3} lg={3} className="g-4">
              {displayActive.map((activity) => (
                <Col key={activity.id} style={{ position: 'relative' }}>
                  <ActivityCard activity={activity} />
                  {/* ปุ่มจัดการ — แสดงเฉพาะ Admin / President */}
                  {canManage && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12, right: 24,
                        zIndex: 10,
                      }}
                    >
                      <Link
                        to={`/activities/${activity.id}/edit`}
                        className="btn btn-sm btn-warning rounded-pill px-2"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: 11 }}
                      >
                        ✏️ แก้ไข
                      </Link>
                    </div>
                  )}
                </Col>
              ))}
            </Row>
          )}
        </section>
      )}

      {/* ===== ส่วนที่ 2: กิจกรรมที่สิ้นสุดแล้ว ===== */}
      {!loading && !error && statusTab !== 'active' && (
        <section>
          <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <span>⚫ สิ้นสุดแล้ว</span>
            <Badge bg="secondary" className="rounded-pill">{displayEnded.length}</Badge>
          </h4>

          {displayEnded.length === 0 ? (
            <div className="text-center py-4 text-muted bg-light rounded-4">
              <p className="fs-4 mb-1">🏁</p>
              <p className="mb-0">ยังไม่มีกิจกรรมที่สิ้นสุด</p>
            </div>
          ) : (
            <Row xs={1} sm={2} md={3} lg={4} className="g-3">
              {displayEnded.map((activity) => (
                <Col key={activity.id}>
                  {/* Ended card จางลงเล็กน้อย */}
                  <div style={{ opacity: 0.8 }}>
                    <ActivityCard activity={activity} />
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </section>
      )}

      {/* ===== Empty state เมื่อกรองแล้วไม่เจออะไรเลย ===== */}
      {!loading && !error && displayActive.length === 0 && displayEnded.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="fs-2">🔍</p>
          <h5>ไม่พบกิจกรรมที่ตรงกับการค้นหา</h5>
          {hasFilter && (
            <Button variant="outline-primary" size="sm" className="mt-2" onClick={clearAll}>
              ล้างการค้นหา
            </Button>
          )}
        </div>
      )}
    </Container>
  );
};