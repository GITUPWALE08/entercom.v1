import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function GuestRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    // Redirect based on role if logged in
    const portalMap: Record<string, string> = {
      customer: '/portal/customer',
      staff: '/portal/staff',
      manager: '/portal/manager',
      admin: '/portal/admin',
      super_admin: '/portal/admin',
    };
    return <Navigate to={portalMap[user.role] || '/'} replace />;
  }

  return <Outlet />;
}
