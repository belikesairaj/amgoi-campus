import CampusEntrance from './pages/CampusEntrance';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Campus Entrance',
    path: '/',
    element: <CampusEntrance />
  },
  {
    name: 'Admin Login',
    path: '/admin',
    element: <AdminLogin />,
    visible: false
  },
  {
    name: 'Admin Dashboard',
    path: '/admin/dashboard',
    element: <AdminDashboard />,
    visible: false
  }
];

export default routes;
