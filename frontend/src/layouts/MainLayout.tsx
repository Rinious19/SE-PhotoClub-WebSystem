//? Layout: Main Layout
//@ Layout หลักที่มี Navbar — ใช้กับทุกหน้าที่ไม่ใช่ Admin

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppNavbar } from '@/components/layout/Navbar';

export const MainLayout: React.FC = () => {
  return (
    <>
      <AppNavbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};