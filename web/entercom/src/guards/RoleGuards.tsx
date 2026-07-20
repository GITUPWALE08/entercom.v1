import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function RoleGuard({ allowedRoles }: { allowedRoles: string[] }) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function CustomerGuard() {
  return <RoleGuard allowedRoles={['customer']} />;
}

export function StaffGuard() {
  return <RoleGuard allowedRoles={['staff', 'manager', 'admin', 'super_admin', 'technician']} />;
}

export function ManagerGuard() {
  return <RoleGuard allowedRoles={['manager', 'admin', 'super_admin']} />;
}

export function AdminGuard() {
  return <RoleGuard allowedRoles={['admin', 'super_admin']} />;
}
