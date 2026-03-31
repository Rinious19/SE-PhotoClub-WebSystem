import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GiHamburgerMenu } from "react-icons/gi";

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
  const navigate = useNavigate();

  const SIDEBAR_ITEMS: SidebarItem[] = [
  { to: "/admin", icon: "🏠", label: "Dashboard" },

  // ❌ ซ่อนสำหรับ admin
  ...(user?.role && user.role !== "ADMIN"
  ? [{ to: "/admin/users", icon: "👥", label: "จัดการสมาชิก" }]
  : []),

  { to: "/admin/history", icon: "📋", label: "ประวัติการใช้งาน" },
  { to: "/admin/event-management", icon: "📅", label: "จัดการอีเว้นท์" },
  { to: "/photos/upload", icon: "📸", label: "อัปโหลดรูปภาพ" },
];

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation(); // 🔥 กัน event ทะลุ
    localStorage.removeItem("token");

    // 👉 ถ้ามี context logout ให้เรียกตรงนี้แทน
    // logout();

    navigate("/login", { replace: true });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 64 : 220,
          background: "#1a1a2e",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            
          }}
        >
          {!collapsed && (
            <NavLink
              to="/"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              SE PhotoClub
            </NavLink>
          )}
          <GiHamburgerMenu
            className="mt-1 d-flex align-items-center justify-content-center"
            onClick={() => setCollapsed((c) => !c)}
          />
        </div>

        {/* Username */}
        {!collapsed && (
          <div style={{ padding: "10px 16px" }}>
            <div>{user?.username}</div>
          </div>
        )}

        {/* Menu */}
        <nav style={{ flex: 1 }}>
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              style={({ isActive }) => ({
                display: "flex",
                padding: "10px 16px",
                color: isActive ? "#fff" : "#aaa",
                textDecoration: "none",
              })}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* 🔥 Logout Only */}
        <button
          onClick={handleLogout}
          style={{
            padding: "12px",
            background: "none",
            border: "none",
            color: "#ff6b6b",
            cursor: "pointer",
            textAlign: "left",
            marginBottom: "7%",
            marginLeft: "1%",
          }}
        >
          ⎋ {!collapsed && "ออกจากระบบ"}
        </button>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
};
