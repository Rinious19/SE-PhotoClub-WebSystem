//? Routes: App Router
//@ จัดการเส้นทางทั้งหมดของเว็บไซต์

import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AppNavbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { LogoutPage } from '@/pages/auth/LogoutPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminRoute } from '@/routes/AdminRoute';

// Photo pages
import { PhotoListPage } from '@/pages/photo/PhotoListPage';
import { UploadPhotoPage } from '@/pages/photo/UploadPhotoPage';
import { EditPhotoPage } from '@/pages/photo/EditPhotoPage';
import { EventPhotosPage } from '@/pages/photo/EventPhotosPage';

// ✅ หน้ากิจกรรม 2 หน้า แยก role
import { ActivitiesPage } from '@/pages/activity/ActivitiesPage';                     // Public — Coming Soon
import { EventManagementPage } from '@/pages/activity/EventManagementPage';           // Admin/President only

const AppLayout = () => (
  <>
    <AppNavbar />
    <main>
      <Outlet />
    </main>
  </>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'logout', element: <LogoutPage /> },

      // โซนสาธารณะ (Guest ดูได้)
      { path: 'photos', element: <PhotoListPage /> },
      // ✅ หน้าดูรูปในกิจกรรม — สาธารณะ
      { path: 'photos/event/:eventName', element: <EventPhotosPage /> },
      // ✅ หน้ากิจกรรมสาธารณะ — Coming Soon
      { path: 'activities', element: <ActivitiesPage /> },

      // โซนสมาชิก (ต้อง Login)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'photos/upload', element: <UploadPhotoPage /> },
        ]
      },

      // ✅ โซน Admin/President เท่านั้น
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin', element: <div className="container py-5"><h3>ระบบจัดการหลังบ้าน (Admin Only)</h3></div> },
          { path: 'photos/edit/:id', element: <EditPhotoPage /> },
          // ✅ หน้าจัดการกิจกรรม — เฉพาะ Admin/President
          { path: 'event-management', element: <EventManagementPage /> },
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};