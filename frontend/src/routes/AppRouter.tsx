import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AppNavbar } from "@/components/layout/Navbar";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { LogoutPage } from "@/pages/auth/LogoutPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AdminRoute } from "@/routes/AdminRoute";

// Photo
import { PhotoListPage } from "@/pages/photo/PhotoListPage";
import { UploadPhotoPage } from "@/pages/photo/UploadPhotoPage";
import { EditPhotoPage } from "@/pages/photo/EditPhotoPage";
import { EventPhotosPage } from "@/pages/photo/EventPhotosPage";

// Activity
import { ActivityListPage } from "@/pages/activity/ActivityListPage";
import { ActivityDetailPage } from "@/pages/activity/ActivityDetailPage";
import { CreateActivityPage } from "@/pages/activity/CreateActivityPage";
import { EditActivityPage } from "@/pages/activity/EditActivityPage";
import { EventManagementPage } from "@/pages/activity/EventManagementPage";

// Admin
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { ManageAdminPage } from "@/pages/admin/ManageAdminPage";
import { HistoryPage } from "@/pages/admin/HistoryPage";

// 🌐 Layout สำหรับหน้าทั่วไป (มี Navbar ด้านบน)
const AppLayout = () => (
  <>
    <AppNavbar />
    <main>
      <Outlet />
    </main>
  </>
);

const router = createBrowserRouter([
  // ==========================================
  // 🟢 กลุ่มที่ 1: หน้าทั่วไป (ใช้ AppLayout ที่มี Navbar)
  // ==========================================
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "logout", element: <LogoutPage /> },

      // Public routes — anyone can view
      { path: "photos", element: <PhotoListPage /> },
      { path: "photos/event/:eventId", element: <EventPhotosPage /> },
      { path: "activities", element: <ActivityListPage /> },
      { path: "activities/:id", element: <ActivityDetailPage /> },

      // Requires login
      {
        element: <ProtectedRoute />,
        children: [{ path: "photos/upload", element: <UploadPhotoPage /> }],
      },

      // ADMIN / CLUB_PRESIDENT (หน้าจัดการที่ยังต้องการให้มี Navbar ด้านบน)
      {
        element: <AdminRoute />,
        children: [
          { path: "photos/edit/:id", element: <EditPhotoPage /> },
          { path: "event-management", element: <EventManagementPage /> },
          { path: "activities/create", element: <CreateActivityPage /> },
          { path: "activities/edit/:id", element: <EditActivityPage /> },
        ],
      },
    ],
  },

  // ==========================================
  // ⚙️ กลุ่มที่ 2: หน้า Dashboard หลังบ้าน (แยกออกมา ไม่มี Navbar)
  // ==========================================
  {
    path: "/admin",
    element: <AdminRoute />, // เช็คสิทธิ์ก่อนเข้า Dashboard
    children: [
      {
        element: <DashboardLayout />, // ใช้ Layout ของ Dashboard (มีแค่ Sidebar)
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "members", element: <ManageAdminPage /> },
          { path: "users", element: <ManageAdminPage /> },
          { path: "history", element: <HistoryPage /> },
          { path: "event-management", element: <EventManagementPage /> },
        ],
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;