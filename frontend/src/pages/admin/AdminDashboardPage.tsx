import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface DashboardCard {
  to: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
  adminOnly?: boolean;
}

const CARDS: DashboardCard[] = [
  {
    to: "/admin/members",
    icon: "👥",
    label: "จัดการสมาชิก",
    desc: "ดู เปลี่ยน Role ระงับบัญชี",
    color: "#4dabf7",
    adminOnly: true,
  },
  {
    to: "/admin/history",
    icon: "📋",
    label: "ประวัติการใช้งาน",
    desc: "ดู Log การเปลี่ยนแปลงในระบบ",
    color: "#51cf66",
  },
  {
    to: "/event-management",
    icon: "📅",
    label: "จัดการอีเว้นท์",
    desc: "เพิ่ม แก้ไข ลบอีเว้นท์",
    color: "#fcc419",
  },
  {
    to: "/photos/upload",
    icon: "📸",
    label: "อัปโหลดรูปภาพ",
    desc: "เพิ่มรูปภาพเข้าระบบ",
    color: "#f06595",
  },
];

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const visibleCards = CARDS.filter(
    (card) => !card.adminOnly || user?.role === "ADMIN"
  );

  return (
    <Container className="py-5">
      <div className="mb-5">
        <h2 className="fw-bold mb-1">สวัสดี, {user?.username} 👋</h2>
        <p className="text-muted">
          {user?.role === "ADMIN" ? "แอดมิน" : "ประธานชมรม"} — SE PhotoClub
        </p>
      </div>

      <Row xs={1} sm={2} md={2} lg={4} className="g-4">
        {visibleCards.map((card) => (
          <Col key={card.to}>
            <Link to={card.to} style={{ textDecoration: "none" }}>
              <Card
                className="h-100 border-0 shadow-sm"
                style={{
                  borderRadius: 16,
                  transition: "transform .18s, box-shadow .18s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 12px 28px rgba(0,0,0,.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                <Card.Body className="p-4">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `${card.color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      marginBottom: 12,
                    }}
                  >
                    {card.icon}
                  </div>
                  <Card.Title className="fw-bold fs-6 mb-1">
                    {card.label}
                  </Card.Title>
                  <Card.Text className="text-muted small mb-0">
                    {card.desc}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Quick links back to public pages */}
      <div className="mt-5 pt-4 border-top">
        <p className="text-muted small fw-medium mb-2">ไปยังหน้าสาธารณะ</p>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/" className="btn btn-sm btn-light rounded-pill px-3">
            🏠 หน้าแรก
          </Link>
          <Link to="/photos" className="btn btn-sm btn-light rounded-pill px-3">
            🖼️ แกลเลอรี่
          </Link>
          <Link
            to="/activities"
            className="btn btn-sm btn-light rounded-pill px-3"
          >
            🏆 กิจกรรม
          </Link>
        </div>
      </div>
    </Container>
  );
};