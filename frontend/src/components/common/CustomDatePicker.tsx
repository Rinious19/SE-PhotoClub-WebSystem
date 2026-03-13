//? Component: CustomDatePicker
//@ ปฏิทินแบบ custom — แสดงและ input เป็น DD/MM/YYYY
//  ใช้แทน native <input type="date"> เพื่อควบคุม UI ได้เต็มที่

import React, { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;          // YYYY-MM-DD (internal format)
  onChange: (v: string) => void;
  placeholder?: string;
  min?: string;           // YYYY-MM-DD
  max?: string;           // YYYY-MM-DD
  size?: 'sm' | 'md';
}

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// แปลง YYYY-MM-DD → DD/MM/YYYY สำหรับแสดงผล
const toDisplay = (v: string) => {
  if (!v) return '';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
};

// แปลง DD/MM/YYYY → YYYY-MM-DD
const toInternal = (v: string): string => {
  const parts = v.replace(/[^0-9/]/g, '').split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  return '';
};

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDayOf = (y: number, m: number) => new Date(y, m, 1).getDay();
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

export const CustomDatePicker: React.FC<Props> = ({
  value, onChange, placeholder = 'DD/MM/YYYY', min, max, size = 'sm'
}) => {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(toDisplay(value));
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split('-')[0]) : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split('-')[1]) - 1 : new Date().getMonth());
  const [mode, setMode] = useState<'day' | 'month' | 'year'>('day');
  const ref = useRef<HTMLDivElement>(null);

  // sync inputText เมื่อ value เปลี่ยนจากภายนอก
  useEffect(() => { setInputText(toDisplay(value)); }, [value]);

  // ปิด popup เมื่อคลิกนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectDate = (y: number, m: number, d: number) => {
    const v = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (min && v < min) return;
    if (max && v > max) return;
    onChange(v);
    setOpen(false);
    setMode('day');
  };

  const isDisabled = (y: number, m: number, d: number) => {
    const v = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (min && v < min) return true;
    if (max && v > max) return true;
    return false;
  };

  const todayStr = today();
  const selY = value ? parseInt(value.split('-')[0]) : null;
  const selM = value ? parseInt(value.split('-')[1]) - 1 : null;
  const selD = value ? parseInt(value.split('-')[2]) : null;

  // manual input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // auto-insert /
    const digits = raw.replace(/\D/g, '');
    let formatted = '';
    if (digits.length <= 2) formatted = digits;
    else if (digits.length <= 4) formatted = `${digits.slice(0,2)}/${digits.slice(2)}`;
    else formatted = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
    setInputText(formatted);
    const internal = toInternal(formatted);
    if (internal) {
      onChange(internal);
      const [y, m] = internal.split('-');
      setViewYear(parseInt(y));
      setViewMonth(parseInt(m) - 1);
    }
  };

  // year range for year picker
  const yearStart = Math.floor(viewYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  const padded = Array(firstDayOf(viewYear, viewMonth)).fill(null);
  const days = Array.from({ length: daysInMonth(viewYear, viewMonth) }, (_, i) => i + 1);

  const inputPadding = size === 'sm' ? '6px 10px' : '8px 12px';
  const inputFontSize = size === 'sm' ? '13px' : '14px';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', minWidth: size === 'sm' ? 130 : 150 }}>
      {/* Input */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1.5px solid #dee2e6', borderRadius: 8,
          padding: inputPadding, background: '#fff', cursor: 'text',
          fontSize: inputFontSize, transition: 'border-color .15s',
          ...(open ? { borderColor: '#0d6efd', boxShadow: '0 0 0 3px rgba(13,110,253,.15)' } : {}),
        }}
        onClick={() => { setOpen(true); setMode('day'); }}
      >
        <span style={{ color: '#6c757d', fontSize: 13 }}>📅</span>
        <input
          value={inputText}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          maxLength={10}
          style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: inputFontSize, color: inputText ? '#212529' : '#adb5bd' }}
        />
        {value && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(''); setInputText(''); }}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#adb5bd', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}
          >✕</button>
        )}
      </div>

      {/* Dropdown Calendar */}
      {open && (
        <div
          onWheel={(e) => {
            e.preventDefault();
            const dir = e.deltaY > 0 ? 1 : -1; // scroll down = next, up = prev
            if (mode === 'day') {
              // เลื่อนทีละเดือน
              if (dir === 1) {
                if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
                else setViewMonth(m => m + 1);
              } else {
                if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
                else setViewMonth(m => m - 1);
              }
            } else if (mode === 'month') {
              setViewYear(y => y + dir);
            } else {
              setViewYear(y => y + dir * 12);
            }
          }} style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 2000,
          background: '#fff', border: '1px solid #e9ecef', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,.12)', padding: 12, minWidth: 240,
          animation: 'dpFadeIn .12s ease',
        }}>
          <style>{`
            @keyframes dpFadeIn { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
            .dp-day:hover:not(.dp-disabled):not(.dp-empty) { background:#e8f0fe !important; color:#0d6efd !important; }
            .dp-day { border-radius:8px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:13px; cursor:pointer; transition:background .1s,color .1s; user-select:none; }
            .dp-nav-btn:hover { background:#f1f3f5; }
          `}</style>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <button className="dp-nav-btn"
              onClick={() => mode === 'day' ? (viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1))
                           : mode === 'month' ? setViewYear(y => y-1)
                           : setViewYear(y => y-12)}
              style={{ border:'none', background:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:15 }}>‹</button>

            <div style={{ display:'flex', gap:4 }}>
              {mode === 'day' && (
                <>
                  <button onClick={() => setMode('month')}
                    style={{ border:'none', background:'none', fontWeight:600, fontSize:13, cursor:'pointer', borderRadius:6, padding:'2px 6px' }}>
                    {MONTHS_TH[viewMonth]}
                  </button>
                  <button onClick={() => setMode('year')}
                    style={{ border:'none', background:'none', fontWeight:600, fontSize:13, cursor:'pointer', borderRadius:6, padding:'2px 6px' }}>
                    {viewYear}
                  </button>
                </>
              )}
              {mode === 'month' && (
                <button onClick={() => setMode('year')}
                  style={{ border:'none', background:'none', fontWeight:600, fontSize:13, cursor:'pointer', borderRadius:6, padding:'2px 6px' }}>
                  {viewYear}
                </button>
              )}
              {mode === 'year' && (
                <span style={{ fontWeight:600, fontSize:13 }}>{yearStart} – {yearStart+11}</span>
              )}
            </div>

            <button className="dp-nav-btn"
              onClick={() => mode === 'day' ? (viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1))
                           : mode === 'month' ? setViewYear(y => y+1)
                           : setViewYear(y => y+12)}
              style={{ border:'none', background:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:15 }}>›</button>
          </div>

          {/* Day view */}
          {mode === 'day' && (
            <>
              {/* Day headers */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#adb5bd', padding:'2px 0' }}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                {padded.map((_, i) => <div key={`e${i}`} />)}
                {days.map(d => {
                  const vStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                  const isToday = vStr === todayStr;
                  const isSel = selY === viewYear && selM === viewMonth && selD === d;
                  const isDis = isDisabled(viewYear, viewMonth, d);
                  return (
                    <div key={d} className={`dp-day${isDis ? ' dp-disabled' : ''}`}
                      onClick={() => !isDis && selectDate(viewYear, viewMonth, d)}
                      style={{
                        background: isSel ? '#0d6efd' : isToday ? '#e8f0fe' : 'transparent',
                        color: isSel ? '#fff' : isDis ? '#ced4da' : isToday ? '#0d6efd' : '#212529',
                        fontWeight: isToday || isSel ? 600 : 400,
                        cursor: isDis ? 'default' : 'pointer',
                      }}>{d}</div>
                  );
                })}
              </div>
            </>
          )}

          {/* Month view */}
          {mode === 'month' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
              {MONTHS_TH.map((m, i) => (
                <button key={i}
                  onClick={() => { setViewMonth(i); setMode('day'); }}
                  style={{
                    border:'none', borderRadius:8, padding:'8px 4px', fontSize:12, cursor:'pointer',
                    background: selM === i && selY === viewYear ? '#0d6efd' : viewMonth === i ? '#e8f0fe' : '#f8f9fa',
                    color: selM === i && selY === viewYear ? '#fff' : viewMonth === i ? '#0d6efd' : '#212529',
                    fontWeight: viewMonth === i ? 600 : 400,
                    transition: 'background .1s',
                  }}>{m}</button>
              ))}
            </div>
          )}

          {/* Year view */}
          {mode === 'year' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
              {years.map(y => (
                <button key={y}
                  onClick={() => { setViewYear(y); setMode('month'); }}
                  style={{
                    border:'none', borderRadius:8, padding:'8px 4px', fontSize:12, cursor:'pointer',
                    background: selY === y ? '#0d6efd' : viewYear === y ? '#e8f0fe' : '#f8f9fa',
                    color: selY === y ? '#fff' : viewYear === y ? '#0d6efd' : '#212529',
                    fontWeight: viewYear === y ? 600 : 400,
                    transition: 'background .1s',
                  }}>{y}</button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop:'1px solid #f1f3f5', marginTop:10, paddingTop:8, display:'flex', justifyContent:'space-between' }}>
            <button
              onClick={() => { onChange(''); setInputText(''); setOpen(false); }}
              style={{ border:'none', background:'none', color:'#6c757d', fontSize:12, cursor:'pointer', padding:'2px 4px', borderRadius:6 }}>
              Clear
            </button>
            <button
              onClick={() => { const t = today(); onChange(t); const [y,m] = t.split('-'); setViewYear(parseInt(y)); setViewMonth(parseInt(m)-1); setOpen(false); }}
              style={{ border:'none', background:'none', color:'#0d6efd', fontSize:12, fontWeight:600, cursor:'pointer', padding:'2px 4px', borderRadius:6 }}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};