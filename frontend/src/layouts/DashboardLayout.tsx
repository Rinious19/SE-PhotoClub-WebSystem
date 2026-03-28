import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GiHamburgerMenu } from "react-icons/gi";

interface SidebarItem {
  to: string;
  icon: string;
  label: string;
}

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const SIDEBAR_ITEMS: SidebarItem[] = [
    { to: "/admin", icon: "🏠", label: "Dashboard" },
    { to: "/admin/users", icon: "👥", label: "จัดการสมาชิก" },
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
              📷 SE PhotoClub
            </NavLink>
          )}
          <GiHamburgerMenu
            className="mt-1 d-flex align-items-center justify-content-center"
            onClick={() => setCollapsed((c) => !c)}
          />
        </div>

        {/* User */}
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
              style={({ isActive }) => ({
                display: "flex",
                padding: "10px 16px",
                color: isActive ? "#fff" : "#aaa",
                textDecoration: "none",
              })}
            >
              {item.icon} {!collapsed && item.label}
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

      {/* Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};
