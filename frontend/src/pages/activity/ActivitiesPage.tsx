//? Page: Activities Page (Public)
//@ หน้าอีเว้นท์สาธารณะ — ทุกคนดูได้ รวมถึง Guest

import React from 'react';
import { Container } from 'react-bootstrap';

export const ActivitiesPage: React.FC = () => {
  return (
    <Container className="py-5 text-center">
      <div className="py-5">
        <p className="display-4 mb-3">📅</p>
        <h2 className="fw-bold mb-3">กิจกรรม</h2>
        <p className="text-muted fs-5">Coming Soon</p>
        <p className="text-muted">หน้าแสดงกิจกรรมของชมรมถ่ายภาพ SE PhotoClub กำลังจะมาเร็วๆ นี้</p>
      </div>
    </Container>
  );
};