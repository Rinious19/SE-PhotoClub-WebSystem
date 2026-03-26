//? Page: AdminDashboardPage
//@ หน้า Dashboard สำหรับ ADMIN / CLUB_PRESIDENT
//  มีปุ่มกลับหน้าหลัก และ link ไปยังหน้า public ได้
//  วางไฟล์นี้ที่: frontend/src/pages/admin/AdminDashboardPage.tsx

import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link, useNavigate }                 from 'react-router-dom';
import { useAuth }                           from '@/hooks/useAuth';

//@ interface card แต่ละช่อง
interface DashboardCard {
  icon:     string;
  title:    string;
  desc:     string;
  to:       string;
  roles:    string[];
  color:    string;
}

const CARDS: DashboardCard[] = [
  {
    icon:  '👥',
    title: 'จัดการสมาชิก',
    desc:  'ดู เปลี่ยน Role ระงับบัญชี',
    to:    '/admin/members',
    roles: ['ADMIN'],
    color: '#e8eaf6',
  },
  {
    icon:  '📋',
    title: 'ประวัติการใช้งาน',
    desc:  'ดู Log การเปลี่ยนแปลงในระบบ',
    to:    '/admin/history',
    roles: ['ADMIN', 'CLUB_PRESIDENT'],
    color: '#e8f5e9',
  },
  {
    icon:  '📅',
    title: 'จัดการอีเว้นท์',
    desc:  'เพิ่ม แก้ไข ลบอีเว้นท์',
    to:    '/event-management',
    roles: ['ADMIN', 'CLUB_PRESIDENT'],
    color: '#e3f2fd',
  },
  {
    icon:  '📷',
    title: 'อัปโหลดรูปภาพ',
    desc:  'เพิ่มรูปภาพเข้าระบบ',
    to:    '/photos/upload',
    roles: ['ADMIN', 'CLUB_PRESIDENT'],
    color: '#fce4ec',
  },
  {
    icon:  '🏆',
    title: 'สร้างกิจกรรมโหวต',
    desc:  'สร้างกิจกรรมโหวตภาพถ่าย',
    to:    '/activities/create',
    roles: ['CLUB_PRESIDENT'],
    color: '#fff8e1',
  },
];

export const AdminDashboardPage: React.FC = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const role       = user?.role ?? '';

  //@ กรอง card ตาม role ของ user ที่ login อยู่
  const visibleCards = CARDS.filter(c => c.roles.includes(role));

  return (
    <Container fluid className="py-4 px-4" style={{ minHeight: '100vh', background: '#f8f9fa' }}>

      {/* ── ปุ่มกลับหน้าหลัก ── */}
      <div className="mb-4">
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-pill px-3"
          onClick={() => navigate('/')}
        >
          ← กลับหน้าหลัก
        </Button>
      </div>

      {/* ── Header ── */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          สวัสดี, {user?.username} 👋
        </h2>
        <p className="text-muted mb-0">
          {role === 'ADMIN' ? 'แอดมิน' : 'ประธานชมรม'} — SE PhotoClub
        </p>
      </div>

      {/* ── Cards ── */}
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {visibleCards.map(card => (
          <Col key={card.to}>
            <Link to={card.to} style={{ textDecoration: 'none' }}>
              <Card
                className="h-100 border-0 rounded-4"
                style={{
                  background:  card.color,
                  transition:  'transform .18s, box-shadow .18s',
                  cursor:      'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform  = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow  = '0 8px 24px rgba(0,0,0,.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform  = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow  = '';
                }}
              >
                <Card.Body className="p-4">
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{card.icon}</div>
                  <Card.Title className="fw-bold fs-6 text-dark mb-1">{card.title}</Card.Title>
                  <Card.Text className="text-muted small mb-0">{card.desc}</Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {/* ── Quick links กลับหน้า public ── */}
      <div className="mt-5 pt-4 border-top">
        <p className="text-muted small fw-medium mb-2">ไปยังหน้าสาธารณะ</p>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/"          className="btn btn-sm btn-light rounded-pill px-3">🏠 หน้าแรก</Link>
          <Link to="/photos"    className="btn btn-sm btn-light rounded-pill px-3">🖼️ แกลเลอรี่</Link>
          <Link to="/activities" className="btn btn-sm btn-light rounded-pill px-3">🏆 กิจกรรม</Link>
        </div>
      </div>
    </Container>
  );
};