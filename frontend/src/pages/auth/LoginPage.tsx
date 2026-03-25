import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '@/hooks/useAuth';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth(); // 🔥 เพิ่ม isAuthenticated

  // 🔥 ใช้ useEffect แทนการเช็คหลัง login
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN' || user.role === 'CLUB_PRESIDENT') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await login({ username, password }); // 🔥 ไม่ต้อง navigate ที่นี่แล้ว
    } catch {
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <Card className="border-0 shadow-sm p-4 rounded-4">
            <h3 className="text-center fw-bold mb-4">เข้าสู่ระบบ</h3>

            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>ชื่อผู้ใช้งาน</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>รหัสผ่าน</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button
                variant="dark"
                type="submit"
                className="w-100 rounded-pill py-2 mb-3"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'เข้าสู่ระบบ'}
              </Button>

              <div className="text-center small">
                ยังไม่มีบัญชีใช่หรือไม่? <Link to="/register">สมัครสมาชิก</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};