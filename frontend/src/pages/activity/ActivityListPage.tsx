//? Page: ActivityListPage
//@ frontend/src/pages/activity/ActivityListPage.tsx

import React, { useState, useMemo } from 'react';
import {
  Container, Row, Col, Form, Button,
  InputGroup, Badge, Alert, Card,
} from 'react-bootstrap';
import { Link, useNavigate }              from 'react-router-dom';
import { useActivities }                   from '@/hooks/useActivities';
import { useAuth }                         from '@/hooks/useAuth';
import type { Activity }                   from '@/types/Activity';
import { CustomDatePicker }                from '@/components/common/CustomDatePicker';

export type ExtendedActivity = Activity & {
  photo_count?: number;
  total_votes?: number; 
};

// ─── ActivityCard ────────────────────────────────────────────
const ActivityCard: React.FC<{ activity: ExtendedActivity }> = ({ activity }) => {
  const { user }  = useAuth();
  
  const statusConfig = {
    UPCOMING: { color: '#ffc107', label: '🟡 รอดำเนินงาน', btn: 'btn-outline-warning' },
    ACTIVE:   { color: '#198754', label: '🟢 กำลังดำเนินการ', btn: 'btn-success' },
    ENDED:    { color: '#6c757d', label: '⚫ สิ้นสุดแล้ว', btn: 'btn-outline-secondary' },
  };

  const config = statusConfig[activity.status as keyof typeof statusConfig] || statusConfig.ENDED;

  const fmt = (iso: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = d.toLocaleDateString('th-TH', { month: 'short' });
      const yy = d.getFullYear() + 543;
      const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      return `${dd} ${mm} ${yy} ${time}`;
    } catch { return '-'; }
  };

  return (
    <Card
      className="h-100 border-0 rounded-4 overflow-hidden"
      style={{
        boxShadow: '0 2px 10px rgba(0,0,0,.07)',
        transition: 'transform .18s, box-shadow .18s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform  = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow  = '0 8px 20px rgba(0,0,0,.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform  = '';
        (e.currentTarget as HTMLElement).style.boxShadow  = '0 2px 10px rgba(0,0,0,.07)';
      }}
    >
      <div style={{ height: 4, background: config.color }} />
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2 gap-2 flex-wrap">
          <Badge bg="white" className="rounded-pill border text-dark" style={{ fontSize:11 }}>
            {config.label}
          </Badge>
        </div>
        <h6 className="fw-bold mb-1 text-dark" style={{ lineHeight:1.3 }}>{activity.title}</h6>
        <p className="text-muted small mb-2" style={{ fontSize:12 }}>📂 {activity.event_name}</p>
        <div className="text-muted" style={{ fontSize:11 }}>
          <div>🕐 เริ่ม: {fmt(activity.start_at)}</div>
          <div>🔚 สิ้นสุด: {fmt(activity.end_at)}</div>
        </div>
        <div className="d-flex gap-3 mt-2 mb-3">
          <span className="text-muted small">🖼️ {activity.photo_count || 0} รูป</span>
          <span className="text-muted small">🗳️ {activity.total_votes || 0} โหวต</span>
        </div>
        <div className="d-flex gap-2">
          <Link
            to={`/activities/${activity.id}`}
            className={`btn btn-sm rounded-pill flex-fill fw-bold ${config.btn}`}
            style={{ fontSize:12 }}
          >
            {activity.status === 'ACTIVE' ? '🗳️ โหวตเลย' : '🔍 ดูรายละเอียด'}
          </Link>
          {(user?.role === 'ADMIN' || user?.role === 'CLUB_PRESIDENT') && (
            <Link
              to={`/activities/edit/${activity.id}`}
              className="btn btn-sm btn-outline-warning rounded-pill px-3"
              style={{ fontSize:12 }}
            >✏️</Link>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

// ─── ActivitySection ─────────────────────────────────────────
const ActivitySection: React.FC<{
  title:     string;
  dot:       string;
  items:     ExtendedActivity[];
  loading:   boolean;
  emptyText: string;
  emptyIcon: string;
}> = ({ title, dot, items, loading, emptyText, emptyIcon }) => (
  <div className="mb-5">
    <div className="d-flex align-items-center gap-2 mb-3">
      <span style={{ width:14, height:14, borderRadius:'50%', background:dot, display:'inline-block', flexShrink:0 }} />
      <h5 className="fw-bold mb-0">{title}</h5>
      <Badge bg="dark" className="rounded-pill ms-1" style={{ fontSize:12 }}>{items.length}</Badge>
    </div>
    <div className="rounded-4 p-3" style={{ background:'#f8f9fa', minHeight:100 }}>
      {loading ? (
        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
          {[1,2,3,4].map(i => (
            <Col key={i}>
              <div className="rounded-4" style={{
                height:200,
                background:'linear-gradient(90deg,#e9ecef 25%,#f8f9fa 50%,#e9ecef 75%)',
                backgroundSize:'200% 100%',
                animation:'shimmer 1.4s infinite',
              }} />
            </Col>
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </Row>
      ) : items.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <div style={{ fontSize:32 }}>{emptyIcon}</div>
          <p className="small mt-2 mb-0">{emptyText}</p>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
          {items.map(a => <Col key={a.id}><ActivityCard activity={a} /></Col>)}
        </Row>
      )}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────
export const ActivityListPage: React.FC = () => {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  
  // ✅ เช็คสิทธิ์การมองเห็นกิจกรรมรอดำเนินงาน
  const canSeeUpcoming = user?.role === 'ADMIN' || user?.role === 'CLUB_PRESIDENT';
  const isPresident    = user?.role === 'CLUB_PRESIDENT';

  const [keyword,   setKeyword]   = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState(''); 
  const [tabStatus, setTabStatus] = useState<'all'|'UPCOMING'|'ACTIVE'|'ENDED'>('all');

  const { activities = [], loading, error, refetch } = useActivities("");
  const extendedActivities = activities as unknown as ExtendedActivity[];

  const filtered = useMemo(() => {
    let list = extendedActivities;
    if (keyword) {
      list = list.filter(a => a.title.toLowerCase().includes(keyword.toLowerCase()));
    }
    if (startDate) {
      const filterStart = new Date(startDate);
      filterStart.setHours(0, 0, 0, 0);
      const filterEnd = new Date(endDate || startDate);
      filterEnd.setHours(23, 59, 59, 999);
      list = list.filter(a => {
        if (!a.start_at || !a.end_at) return false;
        const actStart = new Date(a.start_at);
        const actEnd   = new Date(a.end_at);
        return actStart.getTime() <= filterEnd.getTime() && actEnd.getTime() >= filterStart.getTime();
      });
    }
    if (tabStatus !== 'all') {
      list = list.filter(a => a.status === tabStatus);
    }
    return list;
  }, [extendedActivities, keyword, startDate, endDate, tabStatus]);

  // แยกกลุ่มข้อมูล
  const upcomingItems = filtered.filter(a => a.status === 'UPCOMING');
  const activeItems   = filtered.filter(a => a.status === 'ACTIVE');
  const endedItems    = filtered.filter(a => a.status === 'ENDED');

  const hasFilter   = keyword !== '' || startDate !== '' || tabStatus !== 'all';

  const clearAll = () => {
    setKeyword(''); 
    setStartDate(''); 
    setEndDate('');
    setTabStatus('all');
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">🏆 กิจกรรมโหวตภาพถ่าย</h2>
          <p className="text-muted mb-0">เลือกภาพถ่ายที่คุณชื่นชอบ — 1 คน 1 โหวต ต่อ 1 กิจกรรม</p>
        </div>
        {isPresident && (
          <Button variant="primary" className="fw-bold rounded-pill px-4"
            onClick={() => navigate('/activities/create')}>
            + สร้างกิจกรรม
          </Button>
        )}
      </div>

      <div className="bg-light rounded-4 p-3 mb-4">
        <Row className="g-3 align-items-end">
          <Col md={5}>
            <Form.Label className="fw-medium small text-secondary mb-1">ชื่อกิจกรรม</Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">🔍</InputGroup.Text>
              <Form.Control className="border-start-0" placeholder="ค้นหาชื่อกิจกรรม..."
                value={keyword} onChange={e => setKeyword(e.target.value)} />
              {keyword && <Button variant="outline-secondary" onClick={() => setKeyword('')}>✕</Button>}
            </InputGroup>
          </Col>

          <Col md={5}>
            <Form.Label className="fw-medium small text-secondary mb-1">วันที่จัดกิจกรรม</Form.Label>
            <div className="d-flex gap-2 w-100">
              <div className="flex-fill">
                <CustomDatePicker value={startDate} onChange={(val) => { setStartDate(val); if (!val) setEndDate(''); }} placeholder="ตั้งแต่วันที่..." size="md" />
              </div>
              {startDate && (
                <div className="flex-fill">
                  <CustomDatePicker value={endDate} min={startDate} onChange={(val) => setEndDate(val)} placeholder="ถึงวันที่..." size="md" />
                </div>
              )}
            </div>
          </Col>
          
          <Col md={2} className="d-flex flex-column justify-content-end">
            <Button variant="outline-danger" className="w-100 py-2" style={{ fontSize:'0.85rem' }}
              onClick={clearAll} disabled={!hasFilter}>
              ล้างทั้งหมด
            </Button>
          </Col>
        </Row>

        <div className="d-flex gap-2 mt-3 flex-wrap">
          <button onClick={() => setTabStatus('all')}
              className="d-flex align-items-center gap-1 border-0 rounded-pill px-3 py-1 fw-medium"
              style={{ fontSize:13, cursor:'pointer', background: tabStatus === 'all' ? '#212529' : '#fff', color: tabStatus === 'all' ? '#fff' : '#495057', boxShadow: tabStatus === 'all' ? 'none' : '0 0 0 1px #dee2e6' }}>
              ทั้งหมด
          </button>
          
          <button onClick={() => setTabStatus('ACTIVE')}
              className="d-flex align-items-center gap-1 border-0 rounded-pill px-3 py-1 fw-medium"
              style={{ fontSize:13, cursor:'pointer', background: tabStatus === 'ACTIVE' ? '#212529' : '#fff', color: tabStatus === 'ACTIVE' ? '#fff' : '#495057', boxShadow: tabStatus === 'ACTIVE' ? 'none' : '0 0 0 1px #dee2e6' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#198754', display:'inline-block' }} />
              กำลังดำเนินการ
          </button>

          {/* ✅ แสดงปุ่ม "รอดำเนินงาน" เฉพาะคนที่มีสิทธิ์ */}
          {canSeeUpcoming && (
            <button onClick={() => setTabStatus('UPCOMING')}
                className="d-flex align-items-center gap-1 border-0 rounded-pill px-3 py-1 fw-medium"
                style={{ fontSize:13, cursor:'pointer', background: tabStatus === 'UPCOMING' ? '#212529' : '#fff', color: tabStatus === 'UPCOMING' ? '#fff' : '#495057', boxShadow: tabStatus === 'UPCOMING' ? 'none' : '0 0 0 1px #dee2e6' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#ffc107', display:'inline-block' }} />
                รอดำเนินงาน
            </button>
          )}

          <button onClick={() => setTabStatus('ENDED')}
              className="d-flex align-items-center gap-1 border-0 rounded-pill px-3 py-1 fw-medium"
              style={{ fontSize:13, cursor:'pointer', background: tabStatus === 'ENDED' ? '#212529' : '#fff', color: tabStatus === 'ENDED' ? '#fff' : '#495057', boxShadow: tabStatus === 'ENDED' ? 'none' : '0 0 0 1px #dee2e6' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#6c757d', display:'inline-block' }} />
              สิ้นสุดแล้ว
          </button>
        </div>
      </div>

      {error && !loading && (
        <Alert variant="danger" className="d-flex align-items-center gap-2">
          {error}
          <Button variant="link" size="sm" className="p-0 ms-2" onClick={refetch}>ลองใหม่</Button>
        </Alert>
      )}

      {/* 🟢 ส่วนที่ 1: กำลังดำเนินการ */}
      {(tabStatus === 'all' || tabStatus === 'ACTIVE') && (
        <ActivitySection title="กำลังดำเนินการ" dot="#198754"
          items={activeItems} loading={loading}
          emptyText="ไม่มีกิจกรรมที่กำลังดำเนินการในขณะนี้" emptyIcon="📭" />
      )}

      {/* 🟡 ส่วนที่ 2: รอดำเนินงาน (แสดงเฉพาะ ADMIN / CLUB_PRESIDENT) */}
      {canSeeUpcoming && (tabStatus === 'all' || tabStatus === 'UPCOMING') && (
        <ActivitySection title="รอดำเนินงาน" dot="#ffc107"
          items={upcomingItems} loading={loading}
          emptyText="ไม่มีกิจกรรมที่รอดำเนินงาน" emptyIcon="⏳" />
      )}

      {/* ⚫ ส่วนที่ 3: สิ้นสุดแล้ว */}
      {(tabStatus === 'all' || tabStatus === 'ENDED') && (
        <ActivitySection title="สิ้นสุดแล้ว" dot="#6c757d"
          items={endedItems} loading={loading}
          emptyText="ยังไม่มีกิจกรรมที่สิ้นสุด" emptyIcon="🏁" />
      )}
    </Container>
  );
};