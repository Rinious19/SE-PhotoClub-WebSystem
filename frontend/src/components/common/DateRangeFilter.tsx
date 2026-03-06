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

interface Props {
  value: DateFilter;
  onChange: (f: DateFilter) => void;
}

export const DateRangeFilter: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="d-flex gap-2 align-items-center">
      <CustomDatePicker
        value={value.from}
        max={value.to || undefined}
        onChange={(v) => onChange({ ...value, from: v })}
        placeholder="DD/MM/YYYY"
      />
      {value.from && (
        <>
          <span className="text-muted small fw-bold flex-shrink-0">ถึง</span>
          <CustomDatePicker
            value={value.to}
            min={value.from || undefined}
            onChange={(v) => onChange({ ...value, to: v })}
            placeholder="DD/MM/YYYY"
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