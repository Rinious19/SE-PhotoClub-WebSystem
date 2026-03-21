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

//* context (Main Layout: ทุกหน้าจะเห็น Navbar ยกเว้นหน้า Login/Register ถ้าต้องการแยก)
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
      
      //* context (เส้นทางที่ต้องล็อกอินก่อนเข้าถึง)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'photos', element: <div className="container py-5"><h3>แกลเลอรี่ (Coming Soon)</h3></div> },
          { path: 'activities', element: <div className="container py-5"><h3>กิจกรรม (Coming Soon)</h3></div> },
        ]
      },

      //* context (เส้นทางเฉพาะ Admin)
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin', element: <div className="container py-5"><h3>ระบบจัดการหลังบ้าน (Admin Only)</h3></div> },
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};