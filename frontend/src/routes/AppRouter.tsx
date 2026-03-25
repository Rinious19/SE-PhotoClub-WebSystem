//? Routes: App Router
//@ จัดการเส้นทางทั้งหมดของเว็บไซต์ด้วย Data API
//@ จัดการเส้นทางทั้งหมดของเว็บไซต์

import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AppNavbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { LogoutPage } from '@/pages/auth/LogoutPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminRoute } from '@/routes/AdminRoute';
import { ManageAdminPage } from '@/pages/admin/ManageAdminPage';
import { HistoryPage }     from '@/pages/admin/HistoryPage';

//* context (Main Layout: ทุกหน้าจะเห็น Navbar ยกเว้นหน้า Login/Register ถ้าต้องการแยก)

// Photo pages
import { PhotoListPage } from '@/pages/photo/PhotoListPage';

import { EventPhotosPage } from '@/pages/photo/EventPhotosPage';

// ✅ หน้าอีเว้นท์ 2 หน้า แยก role
import { UploadPhotoPage } from '@/pages/photo/UploadPhotoPage';
import { EditPhotoPage } from '@/pages/photo/EditPhotoPage';
import { ActivitiesPage } from '@/pages/activity/ActivitiesPage';                     // Public — Coming Soon
import { EventManagementPage } from '@/pages/activity/EventManagementPage';           // Admin/President only
export const AppLayout = () => (
  <>
    <AppNavbar />
    <main>
      <Outlet />
    </main>
  </>
);
export const AppRouter = () => {
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login',    element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'logout',   element: <LogoutPage /> },

      //? โซนสาธารณะ (Guest ดูได้)
      { path: 'photos',                        element: <PhotoListPage /> },
      { path: 'photos/event/:eventName',        element: <EventPhotosPage /> },
      { path: 'activities',                     element: <ActivitiesPage /> },

      //? โซนสมาชิก (ต้อง Login)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'photos/upload', element: <UploadPhotoPage /> },
        ]
      },

      //! โซน Admin/President เท่านั้น — ทุก path ต้องอยู่ใน AdminRoute
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin',          element: <div className="container py-5"><h3>ระบบจัดการหลังบ้าน (Admin Only)</h3></div> },
          { path: 'admin/users',    element: <ManageAdminPage /> },   // ← ย้ายเข้ามา
          { path: 'admin/history',  element: <HistoryPage /> },       // ← ย้ายเข้ามา
          { path: 'photos/edit/:id',        element: <EditPhotoPage /> },
          { path: 'event-management',       element: <EventManagementPage /> },
        ]
       }
      ]
    }
  ]);
return <RouterProvider router={router} />;
};