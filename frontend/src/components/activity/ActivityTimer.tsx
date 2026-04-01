//? Component: ActivityTimer
//@ นับถอยหลังเวลาสำหรับกิจกรรมที่กำลัง ACTIVE หรือ UPCOMING
//  อัปเดตทุก 1 วินาที และ cleanup เมื่อ unmount

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from 'react-bootstrap';

interface ActivityTimerProps {
  endAt:   string; // ISO 8601 string เช่น "2025-08-07T23:59:00"
  startAt: string; // ISO 8601 string
  status:  string; // 'ACTIVE' | 'UPCOMING' | 'ENDED'
}

//@ แปลง milliseconds เป็น object วัน/ชั่วโมง/นาที/วินาที
const msToCountdown = (ms: number) => {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

export const ActivityTimer: React.FC<ActivityTimerProps> = ({ endAt, startAt, status }) => {

  //* ✅ ฟังก์ชันช่วยแปลง String จาก DB ให้เป็น Timestamp ที่ถูกต้องตามมาตรฐาน UTC (+7 ไทย)
  const getTimestamp = useCallback((dateStr: string) => {
    if (!dateStr) return 0;
    // 💡 Logic: เติม Z เพื่อบอกว่าเป็น UTC และเปลี่ยนช่องว่างเป็น T ให้เป็น ISO Format
    const formatted = dateStr.includes('Z') || dateStr.includes('+') 
      ? dateStr 
      : `${dateStr.replace(' ', 'T')}Z`;
    return new Date(formatted).getTime();
  }, []);

  //* 🛠️ คำนวณ ms ที่เหลือจากเวลาปัจจุบัน (Real-time comparison)
  const calcRemaining = useCallback(() => {
    const now = Date.now(); // เวลาปัจจุบันของเครื่องผู้ใช้ (Local Time)
    
    if (status === 'UPCOMING') return getTimestamp(startAt) - now;
    if (status === 'ACTIVE')   return getTimestamp(endAt) - now;
    return 0;
  }, [status, startAt, endAt, getTimestamp]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (status === 'ENDED') return;

    // ✅ อัปเดตค่าเริ่มต้นทันทีเมื่อ Props เปลี่ยน เพื่อป้องกันตัวเลขค้าง
    setRemaining(calcRemaining());

    // อัปเดตทุก 1 วินาที
    const interval = setInterval(() => {
      const ms = calcRemaining();
      setRemaining(ms);
      // ถ้าหมดเวลาให้หยุด interval
      if (ms <= 0) clearInterval(interval);
    }, 1000);

    //! cleanup: ต้องล้าง interval เมื่อ component ถูก unmount ป้องกัน memory leak
    return () => clearInterval(interval);
  }, [status, endAt, startAt, calcRemaining]);

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
        <TimerUnit value={hours}   label="ชม." />
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