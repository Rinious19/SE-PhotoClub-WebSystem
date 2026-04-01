//? Component: ActivityCard
//@ การ์ดแสดงข้อมูลกิจกรรมในหน้า ActivityListPage
//  - แสดง preview รูป 3 รูปแรก
//  - แสดงสถานะ + timer
//  - กดเพื่อไปหน้า ActivityDetailPage

import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ActivityTimer } from './ActivityTimer';

interface ActivityCardProps {
  activity: {
    id:          number;
    title:       string;
    description?: string;
    category?:   string;
    event_name:  string;
    start_at:    string;
    end_at:      string;
    status:      string; // 'ACTIVE' | 'UPCOMING' | 'ENDED'
    photo_count: number;
    vote_count:  number;
    creator_name?: string;
    // รูป preview จาก backend (3 รูปแรก) — optional
    preview_photos?: Array<{ thumbnail_url?: string; image_url?: string }>;
  };
}

//@ แปลง image_url เป็น src URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImgSrc = (url?: string): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

//@ สีและ Label ตามสถานะ
const STATUS_CONFIG: Record<string, { bg: string; label: string; icon: string }> = {
  ACTIVE:   { bg: 'success', label: 'กำลังโหวต',  icon: '🟢' },
  UPCOMING: { bg: 'warning', label: 'เร็วๆ นี้',   icon: '🟡' },
  ENDED:    { bg: 'secondary', label: 'สิ้นสุดแล้ว', icon: '⚫' },
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[activity.status] ?? STATUS_CONFIG.ENDED;

  return (
    <Card
      className="h-100 border-0 shadow-sm"
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform .18s, box-shadow .18s',
      }}
      onClick={() => navigate(`/activities/${activity.id}`)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform  = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,.13)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform  = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* ===== Preview รูปภาพ ===== */}
      <div
        style={{
          height: 150,
          background: '#f0f0f0',
          display: 'grid',
          gridTemplateColumns: activity.preview_photos && activity.preview_photos.length >= 2 ? '2fr 1fr' : '1fr',
          gridTemplateRows: activity.preview_photos && activity.preview_photos.length >= 3 ? '1fr 1fr' : '1fr',
          gap: 2,
          padding: 2,
        }}
      >
        {/* ไม่มีรูป preview */}
        {(!activity.preview_photos || activity.preview_photos.length === 0) && (
          <div
            style={{
              gridColumn: '1/-1',
              gridRow:    '1/-1',
              display:    'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#adb5bd',
            }}
          >
            📷
          </div>
        )}

        {/* รูปแรก (ใหญ่) */}
        {activity.preview_photos && activity.preview_photos[0] && (
          <img
            src={getImgSrc(activity.preview_photos[0].thumbnail_url || activity.preview_photos[0].image_url)}
            alt="preview"
            style={{
              gridColumn: activity.preview_photos.length >= 2 ? '1' : '1/-1',
              gridRow:    '1/-1',
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* รูปที่ 2 */}
        {activity.preview_photos && activity.preview_photos[1] && (
          <img
            src={getImgSrc(activity.preview_photos[1].thumbnail_url || activity.preview_photos[1].image_url)}
            alt="preview"
            style={{
              gridColumn: '2', gridRow: '1',
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* รูปที่ 3 */}
        {activity.preview_photos && activity.preview_photos[2] && (
          <img
            src={getImgSrc(activity.preview_photos[2].thumbnail_url || activity.preview_photos[2].image_url)}
            alt="preview"
            style={{
              gridColumn: '2', gridRow: '2',
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Badge จำนวนรูป */}
        <div
          style={{
            position:   'absolute',
            bottom: 8,  right: 8,
            background: 'rgba(0,0,0,.6)',
            color: '#fff',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {activity.photo_count} รูป
        </div>
      </div>

      {/* ===== ข้อมูลกิจกรรม ===== */}
      <Card.Body className="p-3">
        {/* สถานะ + ประเภท */}
        <div className="d-flex gap-2 mb-2 flex-wrap">
          <Badge
            bg={cfg.bg}
            text={activity.status === 'UPCOMING' ? 'dark' : 'white'}
            className="rounded-pill px-2"
            style={{ fontSize: 11 }}
          >
            {cfg.icon} {cfg.label}
          </Badge>
          {activity.category && (
            <Badge bg="light" text="dark" className="rounded-pill px-2 border" style={{ fontSize: 11 }}>
              🏛 {activity.category}
            </Badge>
          )}
        </div>

        {/* ชื่อกิจกรรม */}
        <Card.Title className="fw-bold mb-1" style={{ fontSize: 15, lineHeight: 1.3 }}>
          {activity.title}
        </Card.Title>

        {/* อีเว้นท์ */}
        <p className="text-muted mb-2" style={{ fontSize: 12 }}>
          📂 {activity.event_name}
        </p>

        {/* Timer countdown */}
        {activity.status !== 'ENDED' && (
          <div className="mb-2">
            <ActivityTimer
              endAt={activity.end_at}
              startAt={activity.start_at}
              status={activity.status}
            />
          </div>
        )}

        {/* Footer: จำนวนโหวต */}
        <div
          className="d-flex justify-content-between align-items-center pt-2 border-top"
          style={{ fontSize: 12, color: '#6c757d' }}
        >
          <span>🗳️ {activity.vote_count} โหวตทั้งหมด</span>
          <span>โดย {activity.creator_name || '—'}</span>
        </div>
      </Card.Body>
    </Card>
  );
};