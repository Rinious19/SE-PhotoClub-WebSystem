//? Component: Navbar
//@ แถบเมนูด้านบน — เพิ่ม link กิจกรรม + ปุ่ม Dashboard สำหรับ Admin/President
//  วางไฟล์นี้ที่: frontend/src/components/layout/Navbar.tsx

import { NavLink } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useAuth }                from '@/hooks/useAuth';
import { isAdminOrPresident }     from '@/utils/roleChecker';

export const AppNavbar = () => {
  const { isAuthenticated, user } = useAuth();
  const isManager = isAdminOrPresident(user);

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm py-3 mb-4" sticky="top">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="fw-bold fs-4 text-dark">
          SE PhotoClub
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          {/* ── เมนูซ้าย ── */}
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/"           className="text-secondary">หน้าแรก</Nav.Link>
            <Nav.Link as={NavLink} to="/photos"     className="text-secondary">แกลเลอรี่</Nav.Link>
            <Nav.Link as={NavLink} to="/activities" className="text-secondary">กิจกรรม</Nav.Link>
            {isManager && (
              <Nav.Link as={NavLink} to="/event-management" className="text-secondary">
                จัดการอีเว้นท์
              </Nav.Link>
            )}
          </Nav>

          {/* ── เมนูขวา ── */}
          <Nav>
            {isAuthenticated ? (
              <>
                <Navbar.Text className="me-3 fw-medium text-dark">
                  {user?.username}
                </Navbar.Text>
                {isManager && (
                  <Nav.Link as={NavLink} to="/admin" className="text-primary fw-medium me-2">
                    Dashboard
                  </Nav.Link>
                )}
                <Nav.Link as={NavLink} to="/logout" className="text-danger fw-medium">
                  ออกจากระบบ
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login" className="text-dark fw-medium">
                  เข้าสู่ระบบ
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/register"
                  className="btn btn-primary text-white ms-lg-2 px-3 rounded-pill"
                >
                  สมัครสมาชิก
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};