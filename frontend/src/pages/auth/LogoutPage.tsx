//? Page: Logout Page
//@ ดำเนินการออกจากระบบพร้อมแสดง UI แจ้งเตือน 1.5 วินาที

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { useAuth } from '@/hooks/useAuth';

export const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. ลบข้อมูลใน State และ LocalStorage
    logout();

    // 2. หน่วงเวลา 1.5 วินาทีเพื่อให้ User เห็นแอนิเมชัน แล้วค่อย redirect
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1500);

    //* context (Cleanup function ป้องกัน memory leak หาก component ถูกทำลายก่อนเวลา)
    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '80vh' }}>
      <Spinner animation="border" variant="secondary" className="mb-4" style={{ width: '3rem', height: '3rem' }} />
      <h4 className="fw-medium text-secondary">กำลังออกจากระบบ...</h4>
      <p className="text-muted small">ไว้พบกันใหม่ SE PhotoClub</p>
    </Container>
  );
};