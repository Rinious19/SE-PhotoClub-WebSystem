//? Component: Navigation Bar
//@ แถบเมนูด้านบนของเว็บไซต์ รองรับ Responsive และเปลี่ยนตามสถานะผู้ใช้งาน

import { NavLink } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useAuth } from '@/hooks/useAuth';
import { isAdminOrPresident } from '@/utils/roleChecker';

export const AppNavbar = () => {
  // ไม่ดึง logout มาใช้นะครับ เพราะเราจะให้ลิงก์ไปที่หน้า /logout แทน (เพื่อโชว์ UI โหลดดิ้งบอกลาสวยๆ)
  const { isAuthenticated, user } = useAuth();

  return (
    //* context (Theme Minimalist: พื้นหลังขาว, เงาบางๆ, ตัวหนังสือสีเข้ม)
    <Navbar bg="white" expand="lg" className="shadow-sm py-3 mb-4" sticky="top">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="fw-bold fs-4 text-dark">
        SE PhotoClub
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" className="text-secondary">หน้าแรก</Nav.Link>
            <Nav.Link as={NavLink} to="/photos" className="text-secondary">แกลเลอรี่</Nav.Link>
            <Nav.Link as={NavLink} to="/activities" className="text-secondary">กิจกรรม</Nav.Link>
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <>
                <Navbar.Text className="me-3 fw-medium text-dark">
                  สวัสดี, {user?.username}
                </Navbar.Text>
                
                {isAdminOrPresident(user) && (
                  <Nav.Link as={NavLink} to="/admin" className="text-primary fw-medium">
                    จัดการระบบ
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
                <Nav.Link as={NavLink} to="/register" className="btn btn-primary text-white ms-lg-2 px-3 rounded-pill">
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