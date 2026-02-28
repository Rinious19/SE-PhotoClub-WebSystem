//? Routes: App Router
//@ จัดการเส้นทางทั้งหมดของเว็บไซต์ด้วย Data API

import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AppNavbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { LogoutPage } from '@/pages/auth/LogoutPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminRoute } from '@/routes/AdminRoute';

// Import หน้าเกี่ยวกับ Photo ทั้งหมด
import { PhotoListPage } from '@/pages/photo/PhotoListPage'; 
import { UploadPhotoPage } from '@/pages/photo/UploadPhotoPage';
import { EditPhotoPage } from '@/pages/photo/EditPhotoPage'; // ✅ นำเข้าหน้าแก้ไข

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
      
      //* เส้นทางสำหรับสมาชิกทั่วไป (ต้อง Login)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'photos', element: <PhotoListPage /> },
          { path: 'photos/upload', element: <UploadPhotoPage /> }, 
          { path: 'activities', element: <div className="container py-5"><h3>กิจกรรม (Coming Soon)</h3></div> },
        ]
      },

      //* ✅ เส้นทางเฉพาะ Admin และ President เท่านั้น
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin', element: <div className="container py-5"><h3>ระบบจัดการหลังบ้าน (Admin Only)</h3></div> },
          // ย้ายมาไว้ที่นี่เพื่อให้ปลอดภัยจากการเข้าถึงโดยตรงผ่าน URL
          { path: 'photos/edit/:id', element: <EditPhotoPage /> }, 
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};