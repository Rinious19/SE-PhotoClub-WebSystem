//? Routes: AppRouter
//@ จัดการ Route ทั้งหมด
//  วางไฟล์นี้ที่: frontend/src/routes/AppRouter.tsx

import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AppNavbar }           from '@/components/layout/Navbar';
import { HomePage }            from '@/pages/HomePage';
import { LoginPage }           from '@/pages/auth/LoginPage';
import { RegisterPage }        from '@/pages/auth/RegisterPage';
import { LogoutPage }          from '@/pages/auth/LogoutPage';
import { ProtectedRoute }      from '@/routes/ProtectedRoute';
import { AdminRoute }          from '@/routes/AdminRoute';

// Photo
import { PhotoListPage }       from '@/pages/photo/PhotoListPage';
import { UploadPhotoPage }     from '@/pages/photo/UploadPhotoPage';
import { EditPhotoPage }       from '@/pages/photo/EditPhotoPage';
import { EventPhotosPage }     from '@/pages/photo/EventPhotosPage';

// Activity — import จาก ActivityListPage โดยตรง ไม่ผ่าน ActivitiesPage
import { ActivityListPage }    from '@/pages/activity/ActivityListPage';
import { ActivityDetailPage }  from '@/pages/activity/ActivityDetailPage';
import { CreateActivityPage }  from '@/pages/activity/CreateActivityPage';
import { EditActivityPage }    from '@/pages/activity/EditActivityPage';
import { EventManagementPage } from '@/pages/activity/EventManagementPage';

// Admin
import { AdminDashboardPage }  from '@/pages/admin/AdminDashboardPage';
import { ManageAdminPage }     from '@/pages/admin/ManageAdminPage';
import { HistoryPage }         from '@/pages/admin/HistoryPage';

const AppLayout = () => (
  <>
    <AppNavbar />
    <main><Outlet /></main>
  </>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true,  element: <HomePage /> },
      { path: 'login',    element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'logout',   element: <LogoutPage /> },

      //@ สาธารณะ — ทุกคนดูได้
      { path: 'photos',                  element: <PhotoListPage /> },
      { path: 'photos/event/:eventId', element: <EventPhotosPage /> },
      { path: 'activities',              element: <ActivityListPage /> },
      { path: 'activities/:id',          element: <ActivityDetailPage /> },

      //@ ต้อง login
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'photos/upload', element: <UploadPhotoPage /> },
        ],
      },

      //@ ADMIN / CLUB_PRESIDENT
      {
        element: <AdminRoute />,
        children: [
          { path: 'photos/edit/:id',       element: <EditPhotoPage /> },
          { path: 'event-management',      element: <EventManagementPage /> },
          { path: 'activities/create',     element: <CreateActivityPage /> },
          { path: 'activities/edit/:id',   element: <EditActivityPage /> },
          { path: 'admin',                 element: <AdminDashboardPage /> },
          { path: 'admin/members',         element: <ManageAdminPage /> },
          { path: 'admin/history',         element: <HistoryPage /> },
        ],
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;