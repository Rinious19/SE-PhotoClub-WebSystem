//? Component: DateRangeFilter
//@ ตัวกรองวันที่ — 2 ช่อง "จาก" และ "ถึง"
//  ใส่ช่องเดียว = กรองวันเดียว
//  ใส่ 2 ช่อง   = กรองช่วงวันที่

import React from 'react';
import { Form } from 'react-bootstrap';

export interface DateFilter {
  from: string;   // YYYY-MM-DD
  to: string;     // YYYY-MM-DD
}

export const emptyDateFilter = (): DateFilter => ({ from: '', to: '' });

interface Props {
  value: DateFilter;
  onChange: (f: DateFilter) => void;
}

export const DateRangeFilter: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="d-flex gap-2 align-items-center">
      <Form.Control
        type="date"
        size="sm"
        value={value.from}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      />
      <span className="text-muted small fw-bold flex-shrink-0">ถึง</span>
      <Form.Control
        type="date"
        size="sm"
        value={value.to}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />
    </div>
  );
};

// ✅ Helper: ตรวจว่า dateStr ตรงกับ filter หรือไม่
//  - ไม่ได้ใส่ทั้งคู่ → ผ่านหมด
//  - ใส่แค่ from → วันนั้นขึ้นไป
//  - ใส่แค่ to   → วันนั้นลงมา (= วันเดียว ถ้า from ว่าง)
//  - ใส่ทั้งคู่   → ช่วงวันที่
export const matchesDateFilter = (dateStr: string, filter: DateFilter): boolean => {
  const hasFrom = filter.from !== '';
  const hasTo = filter.to !== '';
  if (!hasFrom && !hasTo) return true;
  if (!dateStr) return false;
  const d = dateStr.split('T')[0];
  if (hasFrom && hasTo) return d >= filter.from && d <= filter.to;
  if (hasFrom) return d === filter.from;   // ใส่แค่ from = วันเดียว
  return d === filter.to;                  // ใส่แค่ to = วันเดียว
};