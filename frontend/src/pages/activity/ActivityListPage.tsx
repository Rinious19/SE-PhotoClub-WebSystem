//? Page: ActivityListPage
//@ หน้ากิจกรรมโหวตภาพถ่าย

import React, { useState, useMemo }       from 'react';
import {
  Container, Row, Col, Form, Button,
  InputGroup, Badge, Alert, Card,
} from 'react-bootstrap';
import { Link, useNavigate }              from 'react-router-dom';
import { useActivities }                  from '@/hooks/useActivities';
import { useAuth }                        from '@/hooks/useAuth';
import type { Activity }                  from '@/types/Activity';
import { CustomDatePicker }               from '@/components/common/CustomDatePicker';

export type ExtendedActivity = Activity & {
  photo_count?: number;
  total_votes?: number; 
};

// ─── ActivityCard ────────────────────────────────────────────
const ActivityCard: React.FC<{ activity: ExtendedActivity }> = ({ activity }) => {
  const { user }  = useAuth();
  const isActive  = activity.status === 'ACTIVE';

  const fmt = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = d.toLocaleDateString('th-TH', { month: 'short' });
    const yy = d.getFullYear() + 543;
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${dd} ${mm} ${yy} ${time}`;
  };

  return (
    <Card
      className="h-100 border-0 rounded-4 overflow-hidden"
      style={{
        boxShadow: isActive ? '0 4px 20px rgba(25,135,84,.15)' : '0 2px 10px rgba(0,0,0,.07)',
        transition: 'transform .18s, box-shadow .18s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform  = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow  = isActive
          ? '0 8px 28px rgba(25,135,84,.2)' : '0 8px 20px rgba(0,0,0,.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform  = '';
        (e.currentTarget as HTMLElement).style.boxShadow  = isActive
          ? '0 4px 20px rgba(25,135,84,.15)' : '0 2px 10px rgba(0,0,0,.07)';
      }}
    >
      <div style={{ height: 4, background: isActive ? '#198754' : '#6c757d' }} />
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2 gap-2 flex-wrap">
          <Badge bg={isActive ? 'success' : 'secondary'} className="rounded-pill" style={{ fontSize:11 }}>
            {isActive ? '🟢 กำลังดำเนินการ' : '⚫ สิ้นสุดแล้ว'}
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
            className={`btn btn-sm rounded-pill flex-fill fw-bold ${isActive ? 'btn-success' : 'btn-outline-secondary'}`}
            style={{ fontSize:12 }}
          >
            {isActive ? '🗳️ โหวตเลย' : '🔍 ดูผลโหวต'}
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
  const isPresident = user?.role === 'CLUB_PRESIDENT';

  const [keyword,   setKeyword]   = useState('');
  
  // ✅ แยก State สำหรับช่วงวันที่ ค้นหาตั้งแต่ - ถึง
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState(''); 
  
  const [tabStatus, setTabStatus] = useState<'all'|'ACTIVE'|'ENDED'>('all');

  const { activities = [], loading, error, refetch } = useActivities("");
  const extendedActivities = activities as unknown as ExtendedActivity[];

  const filtered = useMemo(() => {
    let list = extendedActivities;

    // กรองชื่อ
    if (keyword) {
      list = list.filter(a => a.title.toLowerCase().includes(keyword.toLowerCase()));
    }

    // ✅ กรองช่วงวันที่ (Overlap Logic)
    if (startDate) {
      const filterStart = new Date(startDate);
      filterStart.setHours(0, 0, 0, 0);

      // ถ้าไม่กรอกวันสิ้นสุด ให้ถือว่าค้นหาแค่วันเดียว
      const filterEnd = new Date(endDate || startDate);
      filterEnd.setHours(23, 59, 59, 999);

      list = list.filter(a => {
        if (!a.start_at || !a.end_at) return false;
        const actStart = new Date(a.start_at);
        const actEnd   = new Date(a.end_at);

        // เช็คว่ากิจกรรมนี้จัดอยู่ในช่วงเวลาที่เลือกหรือไม่ (คาบเกี่ยวกัน)
        return actStart.getTime() <= filterEnd.getTime() && actEnd.getTime() >= filterStart.getTime();
      });
    }

    // กรองสถานะ
    if (tabStatus !== 'all') {
      list = list.filter(a => a.status === tabStatus);
    }

    return list;
  }, [extendedActivities, keyword, startDate, endDate, tabStatus]);

  const activeItems = filtered.filter(a => a.status === 'ACTIVE');
  const endedItems  = filtered.filter(a => a.status === 'ENDED');
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

          {/* ✅ ส่วนเลือกช่วงวันที่ */}
          <Col md={5}>
            <Form.Label className="fw-medium small text-secondary mb-1">วันที่จัดกิจกรรม</Form.Label>
            <div className="d-flex gap-2 w-100" style={{ transition: 'all 0.3s ease' }}>
              <div className="flex-fill">
                <CustomDatePicker 
                  value={startDate} 
                  onChange={(val) => {
                    setStartDate(val);
                    if (!val) setEndDate(''); // ถ้าล้างวันเริ่มต้น ให้ล้างวันสิ้นสุดด้วย
                  }} 
                  placeholder="ตั้งแต่วันที่..."
                  size="md"
                />
              </div>
              
              {/* ซ่อนไว้จนกว่าจะมีค่า startDate */}
              {startDate && (
                <div className="flex-fill" style={{ animation: 'fadeIn 0.2s ease' }}>
                  <CustomDatePicker 
                    value={endDate} 
                    min={startDate} // ห้ามเลือกก่อนวันเริ่มต้น
                    onChange={(val) => setEndDate(val)} 
                    placeholder="ถึงวันที่..."
                    size="md"
                  />
                </div>
              )}
            </div>
            {/* อนิเมชั่นสำหรับการโผล่ขึ้นมาของปฏิทินที่ 2 */}
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }`}</style>
          </Col>
          
          <Col md={2} className="d-flex flex-column justify-content-end">
            <Button variant="outline-danger" className="w-100 py-2" style={{ fontSize:'0.85rem' }}
              onClick={clearAll} disabled={!hasFilter}>
              ล้างทั้งหมด
            </Button>
          </Col>
        </Row>

        <div className="d-flex gap-2 mt-3 flex-wrap">
          {([
            { key:'all',    label:'ทั้งหมด',          dot:'' },
            { key:'ACTIVE', label:'กำลังดำเนินการ',    dot:'#198754' },
            { key:'ENDED',  label:'สิ้นสุดแล้ว',       dot:'#6c757d' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setTabStatus(tab.key)}
              className="d-flex align-items-center gap-1 border-0 rounded-pill px-3 py-1 fw-medium"
              style={{
                fontSize:13, cursor:'pointer',
                background: tabStatus === tab.key ? '#212529' : '#fff',
                color:      tabStatus === tab.key ? '#fff'    : '#495057',
                boxShadow:  tabStatus === tab.key ? 'none'    : '0 0 0 1px #dee2e6',
              }}>
              {tab.dot && <span style={{ width:8, height:8, borderRadius:'50%', background:tab.dot, display:'inline-block' }} />}
              {tab.label}
            </button>
          ))}
        </div>

        {hasFilter && !loading && (
          <div className="mt-2 pt-2 border-top">
            <small className="text-muted">
              พบ <strong className="text-primary">{filtered.length}</strong> จาก {activities.length} กิจกรรม
            </small>
          </div>
        )}
      </div>

      {error && !loading && (
        <Alert variant="danger" className="d-flex align-items-center gap-2">
          {error}
          <Button variant="link" size="sm" className="p-0 ms-2" onClick={refetch}>ลองใหม่</Button>
        </Alert>
      )}

      {!loading && !error && hasFilter && filtered.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p style={{ fontSize:36 }}>🔍</p>
          <p className="mb-2">ไม่พบกิจกรรมที่ตรงกับการค้นหา</p>
          <Button variant="outline-primary" size="sm" onClick={clearAll}>ล้างการค้นหา</Button>
        </div>
      )}

      {(!hasFilter || tabStatus === 'all' || tabStatus === 'ACTIVE') && (
        <ActivitySection title="กำลังดำเนินการ" dot="#198754"
          items={activeItems} loading={loading}
          emptyText="ไม่มีกิจกรรมที่กำลังดำเนินการในขณะนี้" emptyIcon="📭" />
      )}
      {(!hasFilter || tabStatus === 'all' || tabStatus === 'ENDED') && (
        <ActivitySection title="สิ้นสุดแล้ว" dot="#6c757d"
          items={endedItems} loading={loading}
          emptyText="ยังไม่มีกิจกรรมที่สิ้นสุด" emptyIcon="🏁" />
      )}
    </Container>
  );
};