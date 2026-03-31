import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GiHamburgerMenu } from "react-icons/gi";

interface SidebarItem {
  to: string;
  icon: string;
  label: string;
  presidentOnly?: boolean; // เปลี่ยนจาก adminOnly เป็น presidentOnly
}

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const SIDEBAR_ITEMS: SidebarItem[] = [
    { to: "/admin", icon: "🏠", label: "Dashboard" },
    { 
      to: "/admin/members", 
      icon: "👥", 
      label: "จัดการสมาชิก", 
      presidentOnly: true // กำหนดให้เฉพาะประธานชมรมเห็น
    },
    { to: "/admin/history", icon: "📋", label: "ประวัติการใช้งาน" },
    { to: "/event-management", icon: "📅", label: "จัดการอีเว้นท์" },
    { to: "/photos/upload", icon: "📸", label: "อัปโหลดรูปภาพ" },
  ];

  // กรองเมนู Sidebar: 
  // ถ้าเป็น presidentOnly จะแสดงก็ต่อเมื่อ role คือ CLUB_PRESIDENT เท่านั้น
  const visibleItems = SIDEBAR_ITEMS.filter((item) => {
    if (item.presidentOnly) {
      return user?.role === "CLUB_PRESIDENT";
    }
    return true; // เมนูอื่นๆ แอดมินและประธานชมรมเห็นได้ตามปกติ
  });

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
          transition: "width 0.2s ease",
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {!collapsed && (
            <NavLink
              to="/"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: 15,
              }}
            >
              SE PhotoClub
            </NavLink>
          )}
          <GiHamburgerMenu
            style={{ cursor: "pointer", flexShrink: 0 }}
            onClick={() => setCollapsed((c) => !c)}
          />
        </div>

        {/* Username */}
        {!collapsed && user?.username && (
          <div style={{ padding: "4px 16px 12px", color: "#aaa", fontSize: 13 }}>
            {user.username}
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                background: "#333",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {user.role}
            </span>
          </div>
        )}

        {/* Menu */}
        <nav style={{ flex: 1 }}>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                color: isActive ? "#fff" : "#aaa",
                textDecoration: "none",
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                fontSize: 14,
              })}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            padding: "12px 16px",
            background: "none",
            border: "none",
            color: "#ff6b6b",
            cursor: "pointer",
            textAlign: "left",
            marginBottom: "5%",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⎋</span>
          {!collapsed && "ออกจากระบบ"}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
};