//? Page: Home Page
//@ หน้าแรกของเว็บไซต์ (Landing Page)

import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <Container className="py-5">
      <Row className="text-center align-items-center" style={{ minHeight: '60vh' }}>
        <Col>
          <h1 className="fw-bold display-4 mb-3">
            ยินดีต้อนรับสู่ <span className="text-primary">SE PhotoClub</span>
          </h1>
          <p className="lead text-secondary mb-5">
            ระบบจัดการชมรมถ่ายภาพสำหรับนักศึกษา รวบรวมผลงานและกิจกรรมไว้ในที่เดียว
          </p>
          <div>
            {/* แก้บัค Type Strict: ใช้ <Link> ตรงๆ แล้วสวมคลาส btn ของ Bootstrap แทน */}
            <Link to="/photos" className="btn btn-dark btn-lg rounded-pill px-4 mx-2 mb-2">
              ชมแกลเลอรี่
            </Link>
            <Link to="/activities" className="btn btn-outline-dark btn-lg rounded-pill px-4 mx-2 mb-2">
              ดูกิจกรรมล่าสุด
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};