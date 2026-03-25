//? Routes: App Router (Merged Version)
//@ รองรับทั้ง Main Layout (User) + Dashboard Layout (Admin)

import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

// Layouts
import { AppNavbar } from '@/components/layout/Navbar';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Routes Guard
import { AdminRoute } from '@/routes/AdminRoute';

// Pages
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { LogoutPage } from '@/pages/auth/LogoutPage';
import { PhotoListPage } from '@/pages/photo/PhotoListPage';
import { EventPhotosPage } from '@/pages/photo/EventPhotosPage';
import { UploadPhotoPage } from '@/pages/photo/UploadPhotoPage';
import { EditPhotoPage } from '@/pages/photo/EditPhotoPage';
import { ActivitiesPage } from '@/pages/activity/ActivitiesPage';
import { EventManagementPage } from '@/pages/activity/EventManagementPage';
import { ManageAdminPage } from '@/pages/admin/ManageAdminPage';
import { HistoryPage } from '@/pages/admin/HistoryPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'; // ✅ ต้องมี

//* Main Layout (Navbar)
export const MainLayout = () => (
  <>
    <AppNavbar />
    <main>
      <Outlet />
    </main>
  </>
);

export const AppRouter = () => {
  const router = createBrowserRouter([
    // =========================
    // 🌐 USER ZONE (MainLayout)
    // =========================
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'register', element: <RegisterPage /> },
        { path: 'logout', element: <LogoutPage /> },

        // Public
        { path: 'photos', element: <PhotoListPage /> },
        { path: 'photos/event/:eventName', element: <EventPhotosPage /> },
        { path: 'activities', element: <ActivitiesPage /> },

      ],
    },

    // =========================
    // 🔐 ADMIN ZONE (Dashboard)
    // =========================
    {
      element: <AdminRoute />,
      children: [
        {
          element: <DashboardLayout />,
          children: [
            { path: '/admin', element: <AdminDashboardPage /> },
            { path: '/admin/users', element: <ManageAdminPage /> },
            { path: '/admin/history', element: <HistoryPage /> },

            // แนะนำให้ใส่ prefix admin ให้ consistent
            { path: '/admin/event-management', element: <EventManagementPage /> },
            { path: 'photos/upload', element: <UploadPhotoPage /> },
            { path: '/photos/edit/:id', element: <EditPhotoPage /> },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};