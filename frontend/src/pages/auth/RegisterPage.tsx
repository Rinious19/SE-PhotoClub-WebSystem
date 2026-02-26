//? Page: Register Page
//@ หน้าจอสำหรับสมัครสมาชิกใหม่

import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '@/hooks/useAuth';

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await register({ username, password });
      // กลับไปหน้า login หลังจากสมัครเสร็จ
      navigate('/login');
    } catch {
      setErrorMsg('ไม่สามารถสมัครสมาชิกได้ ชื่อผู้ใช้นี้อาจมีในระบบแล้ว');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <Card className="border-0 shadow-sm p-4 rounded-4">
            <h3 className="text-center fw-bold mb-4">สมัครสมาชิก</h3>
            
            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formRegUsername">
                <Form.Label className="text-secondary">ชื่อผู้ใช้งาน</Form.Label>
                <Form.Control 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                  className="rounded-3"
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="formRegPassword">
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
                variant="primary" 
                type="submit" 
                className="w-100 rounded-pill py-2 fw-medium mb-3"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'ยืนยันการสมัคร'}
              </Button>

              <div className="text-center text-secondary small">
                มีบัญชีอยู่แล้ว? <Link to="/login" className="text-primary fw-bold text-decoration-none">เข้าสู่ระบบ</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};