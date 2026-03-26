//? Layout: DashboardLayout
//@ Layout สำหรับหน้า Admin — sidebar ซ้าย + content ขวา
//  มีปุ่มกลับหน้าหลัก และ logout ด้านล่าง sidebar
//  วางไฟล์นี้ที่: frontend/src/layouts/DashboardLayout.tsx

import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth }                       from '@/hooks/useAuth';

//@ nav items ใน sidebar
const NAV_ITEMS = [
  { icon: '🏠',  label: 'Dashboard',          to: '/admin',            roles: ['ADMIN','CLUB_PRESIDENT'] },
  { icon: '👥',  label: 'จัดการสมาชิก',        to: '/admin/members',    roles: ['ADMIN'] },
  { icon: '📋',  label: 'ประวัติการใช้งาน',     to: '/admin/history',    roles: ['ADMIN','CLUB_PRESIDENT'] },
  { icon: '📅',  label: 'จัดการอีเว้นท์',       to: '/event-management', roles: ['ADMIN','CLUB_PRESIDENT'] },
  { icon: '📷',  label: 'อัปโหลดรูปภาพ',        to: '/photos/upload',    roles: ['ADMIN','CLUB_PRESIDENT'] },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const role = user?.role ?? '';

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>

      {/* ── Sidebar ── */}
      <aside
        style={{
          width:      collapsed ? 60 : 200,
          background: '#1a1a2e',
          color:      '#fff',
          display:    'flex',
          flexDirection: 'column',
          transition: 'width .2s',
          flexShrink: 0,
          position:   'sticky',
          top:        0,
          height:     '100vh',
          overflowY:  'auto',
        }}
      >
        {/* Logo + toggle */}
        <div
          style={{
            padding:    '16px 12px',
            borderBottom: '1px solid rgba(255,255,255,.1)',
            display:    'flex',
            alignItems: 'center',
            gap:        8,
          }}
        >
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: 'none', border: 'none', color: '#fff',
              cursor: 'pointer', fontSize: 18, padding: 0,
            }}
          >☰</button>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
              SE PhotoClub
            </span>
          )}
        </div>

        {/* Username */}
        {!collapsed && (
          <div style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
            {user?.username}
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              style={({ isActive }) => ({
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                padding:        '10px 16px',
                color:          isActive ? '#fff' : 'rgba(255,255,255,.65)',
                background:     isActive ? 'rgba(255,255,255,.1)' : 'none',
                textDecoration: 'none',
                fontSize:       13,
                borderLeft:     isActive ? '3px solid #7c3aed' : '3px solid transparent',
                transition:     'background .15s',
                whiteSpace:     'nowrap',
                overflow:       'hidden',
              })}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* ปุ่มกลับหน้าหลัก + ออกจากระบบ */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '12px 0' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display:    'flex', alignItems: 'center', gap: 10,
              padding:    '10px 16px', background: 'none', border: 'none',
              color:      'rgba(255,255,255,.65)', cursor: 'pointer',
              fontSize:   13, width: '100%', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>🏠</span>
            {!collapsed && 'หน้าหลัก'}
          </button>
          <button
            onClick={logout}
            style={{
              display:    'flex', alignItems: 'center', gap: 10,
              padding:    '10px 16px', background: 'none', border: 'none',
              color:      '#ef4444', cursor: 'pointer',
              fontSize:   13, width: '100%', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚪</span>
            {!collapsed && 'ออกจากระบบ'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
};