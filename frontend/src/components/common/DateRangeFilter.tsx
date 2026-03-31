//? Component: DateRangeFilter
//@ ตัวกรองวันที่ — 2 ช่อง "จาก" และ "ถึง" แบบ DD/MM/YYYY
//  ใส่ช่องเดียว = กรองวันเดียว, ใส่ 2 ช่อง = กรองช่วงวันที่

import React from 'react';
import { CustomDatePicker } from '@/components/common/CustomDatePicker';

export interface DateFilter {
  from: string;   // YYYY-MM-DD
  to: string;     // YYYY-MM-DD
}

export const emptyDateFilter = (): DateFilter => ({ from: '', to: '' });

// ✅ helper: วันนี้ใน local timezone (ป้องกัน UTC เพี้ยน)
const getTodayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

interface Props {
  value: DateFilter;
  onChange: (f: DateFilter) => void;
}

export const DateRangeFilter: React.FC<Props> = ({ value, onChange }) => {
  const todayStr = getTodayStr();

  return (
    <div className="d-flex gap-2 align-items-center">
      {/* ช่อง "จาก" — max คือ: ถ้ามี to ให้ใช้ to, ไม่งั้นใช้วันนี้ */}
      <CustomDatePicker
        value={value.from}
        max={value.to || todayStr}
        onChange={(v) => onChange({ ...value, from: v })}
        placeholder="ตั้งแต่วันที่..."
      />
      {value.from && (
        <>
          <span className="text-muted small fw-bold flex-shrink-0">ถึง</span>
          {/* ช่อง "ถึง" — min คือ from, max คือวันนี้ */}
          <CustomDatePicker
            value={value.to}
            min={value.from || undefined}
            max={todayStr}
            onChange={(v) => onChange({ ...value, to: v })}
            placeholder="ถึงวันที่..."
          />
        </>
      )}
    </div>
  );
};

// ✅ Helper: ตรวจว่า dateStr ตรงกับ filter หรือไม่
export const matchesDateFilter = (dateStr: string, filter: DateFilter): boolean => {
  const hasFrom = filter.from !== '';
  const hasTo = filter.to !== '';
  if (!hasFrom && !hasTo) return true;
  if (!dateStr) return false;
  const d = dateStr.split('T')[0];
  if (hasFrom && hasTo) return d >= filter.from && d <= filter.to;
  if (hasFrom) return d === filter.from;
  return d === filter.to;
};