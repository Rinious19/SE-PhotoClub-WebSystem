//? Page: Login Page
//@ หน้าจอเข้าสู่ระบบสำหรับสมาชิก

import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '@/hooks/useAuth';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await login({ username, password });
      //! สิ่งที่สำคัญมาก (ใช้ replace: true เพื่อไม่ให้กดย้อนกลับมาหน้า Login ได้อีกหลังจากเข้าสู่ระบบแล้ว)
      navigate('/', { replace: true });
    } catch {
      //* context (ไม่ใส่ตัวแปร error ใน catch เพื่อป้องกันกฎ noUnusedLocals)
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    //* context (จัดกึ่งกลางหน้าจอแบบ Minimal)
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <Card className="border-0 shadow-sm p-4 rounded-4">
            <h3 className="text-center fw-bold mb-4">เข้าสู่ระบบ</h3>
            
            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label className="text-secondary">ชื่อผู้ใช้งาน</Form.Label>
                <Form.Control 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                  className="rounded-3"
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="formPassword">
                <Form.Label className="text-secondary">รหัสผ่าน</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="rounded-3"
                />
              </Form.Group>

              <Button 
                variant="dark" 
                type="submit" 
                className="w-100 rounded-pill py-2 fw-medium mb-3"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'เข้าสู่ระบบ'}
              </Button>

              <div className="text-center text-secondary small">
                ยังไม่มีบัญชีใช่หรือไม่? <Link to="/register" className="text-dark fw-bold text-decoration-none">สมัครสมาชิก</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};