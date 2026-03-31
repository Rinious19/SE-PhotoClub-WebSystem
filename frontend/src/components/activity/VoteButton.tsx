//? Component: VoteButton
//@ ปุ่มโหวตรูปภาพ — แสดงสถานะตามสิทธิ์ผู้ใช้
//  - GUEST → แสดง Modal ให้ไป Login/Register
//  - โหวตแล้ว → Disabled พร้อมแสดงเครื่องหมายถูก
//  - กิจกรรมสิ้นสุด → Disabled ไม่มีปุ่มโหวต

import React from 'react';
import { Button } from 'react-bootstrap';

interface VoteButtonProps {
  activityPhotoId: number;         // id ใน activity_photos
  activityStatus:  string;         // ACTIVE | ENDED | UPCOMING
  isLoggedIn:      boolean;        // ล็อกอินอยู่หรือไม่
  hasVoted:        boolean;        // โหวตกิจกรรมนี้ไปแล้วหรือเปล่า
  votedPhotoId?:   number;         // activity_photo_id ที่โหวตให้ (ถ้าโหวตแล้ว)
  voteCount:       number;         // จำนวนโหวต
  onVote:          (activityPhotoId: number) => void; // callback เมื่อกดโหวต
  onGuestClick:    () => void;     // callback เมื่อ Guest กดโหวต
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  activityPhotoId,
  activityStatus,
  isLoggedIn,
  hasVoted,
  votedPhotoId,
  voteCount,
  onVote,
  onGuestClick,
}) => {
  // กิจกรรมสิ้นสุดแล้ว → แสดงจำนวนโหวตอย่างเดียว ไม่มีปุ่ม
  if (activityStatus === 'ENDED' || activityStatus === 'UPCOMING') {
    return (
      <div
        className="d-flex align-items-center justify-content-center gap-1"
        style={{ fontSize: 13, color: '#6c757d', fontWeight: 500 }}
      >
        <span>🗳️</span>
        <span>{voteCount} โหวต</span>
      </div>
    );
  }

  // กิจกรรม ACTIVE แต่ Guest → ปุ่มโหวตที่กดแล้ว redirect
  if (!isLoggedIn) {
    return (
      <Button
        size="sm"
        variant="outline-primary"
        className="w-100 rounded-pill fw-bold"
        style={{ fontSize: 12 }}
        onClick={onGuestClick}
      >
        🗳️ โหวต ({voteCount})
      </Button>
    );
  }

  // User โหวตกิจกรรมนี้ไปแล้ว
  if (hasVoted) {
    // รูปที่ user โหวต → แสดงสีพิเศษ
    const isThisPhotoVoted = votedPhotoId === activityPhotoId;
    return (
      <Button
        size="sm"
        variant={isThisPhotoVoted ? 'success' : 'light'}
        className="w-100 rounded-pill fw-bold"
        style={{ fontSize: 12 }}
        disabled
      >
        {isThisPhotoVoted ? '✅ โหวตแล้ว' : `🗳️ ${voteCount} โหวต`}
      </Button>
    );
  }

  // User ยังไม่ได้โหวต → ปุ่มโหวตปกติ
  return (
    <Button
      size="sm"
      variant="primary"
      className="w-100 rounded-pill fw-bold"
      style={{ fontSize: 12 }}
      onClick={() => onVote(activityPhotoId)}
    >
      🗳️ โหวต ({voteCount})
    </Button>
  );
};