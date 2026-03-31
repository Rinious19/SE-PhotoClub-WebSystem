//? Component: ActivityTimer
//@ นับถอยหลังเวลาสำหรับกิจกรรมที่กำลัง ACTIVE หรือ UPCOMING
//  อัปเดตทุก 1 วินาที และ cleanup เมื่อ unmount

import React, { useState, useEffect } from 'react';
import { Badge } from 'react-bootstrap';

interface ActivityTimerProps {
  endAt:   string; // ISO 8601 string เช่น "2025-08-07T23:59:00"
  startAt: string; // ISO 8601 string
  status:  string; // 'ACTIVE' | 'UPCOMING' | 'ENDED'
}

//@ แปลง milliseconds เป็น object วัน/ชั่วโมง/นาที/วินาที
const msToCountdown = (ms: number) => {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

export const ActivityTimer: React.FC<ActivityTimerProps> = ({ endAt, startAt, status }) => {

  //* คำนวณ ms ที่เหลือจากเวลาปัจจุบัน
  const calcRemaining = () => {
    const now = Date.now();
    if (status === 'UPCOMING') return new Date(startAt).getTime() - now;
    if (status === 'ACTIVE')   return new Date(endAt).getTime() - now;
    return 0;
  };

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (status === 'ENDED') return;

    // อัปเดตทุก 1 วินาที
    const interval = setInterval(() => {
      const ms = calcRemaining();
      setRemaining(ms);
      // ถ้าหมดเวลาให้หยุด interval
      if (ms <= 0) clearInterval(interval);
    }, 1000);

    //! cleanup: ต้องล้าง interval เมื่อ component ถูก unmount ป้องกัน memory leak
    return () => clearInterval(interval);
  }, [status, endAt, startAt]);

  // กิจกรรมสิ้นสุดแล้ว
  if (status === 'ENDED') {
    return (
      <Badge bg="secondary" className="rounded-pill px-3 py-2" style={{ fontSize: 12 }}>
        🏁 กิจกรรมสิ้นสุดแล้ว
      </Badge>
    );
  }

  if (remaining <= 0) {
    return (
      <Badge bg="secondary" className="rounded-pill px-3 py-2" style={{ fontSize: 12 }}>
        ⏳ กำลังอัปเดต...
      </Badge>
    );
  }

  const { days, hours, minutes, seconds } = msToCountdown(remaining);
  const isUpcoming = status === 'UPCOMING';

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      {/* Label บอกว่านับถอยหลังอะไร */}
      <Badge
        bg={isUpcoming ? 'warning' : 'danger'}
        text={isUpcoming ? 'dark' : 'white'}
        className="rounded-pill px-3 py-2"
        style={{ fontSize: 11 }}
      >
        {isUpcoming ? '🕐 เริ่มในอีก' : '⏱️ เหลือเวลา'}
      </Badge>

      {/* ตัวนับถอยหลัง */}
      <div className="d-flex gap-1 align-items-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {days > 0 && (
          <TimerUnit value={days} label="วัน" />
        )}
        <TimerUnit value={hours}   label="ชม." />
        <span style={{ color: '#6c757d', fontWeight: 700 }}>:</span>
        <TimerUnit value={minutes} label="นาที" />
        <span style={{ color: '#6c757d', fontWeight: 700 }}>:</span>
        <TimerUnit value={seconds} label="วิ" />
      </div>
    </div>
  );
};

//@ Sub-component: กล่องแสดงตัวเลขแต่ละหน่วย
const TimerUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="text-center" style={{ minWidth: 36 }}>
    <div
      style={{
        background: '#212529',
        color: '#fff',
        borderRadius: 6,
        padding: '2px 6px',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.05em',
      }}
    >
      {String(value).padStart(2, '0')}
    </div>
    <div style={{ fontSize: 9, color: '#6c757d', marginTop: 2 }}>{label}</div>
  </div>
);