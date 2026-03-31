//? Route Guard: AdminRoute
//@ อนุญาตเฉพาะ ADMIN และ CLUB_PRESIDENT
//  วางไฟล์นี้ที่: frontend/src/routes/AdminRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth }           from '@/hooks/useAuth';
import { isAdminOrPresident } from '@/utils/roleChecker';

export const AdminRoute = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdminOrPresident(user)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};