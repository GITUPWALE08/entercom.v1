import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useLogout';
import { useWebsocket } from '../hooks/useWebsocket';
import { Menu, X, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import logo from '../assets/logo.png';
import { NotificationCenter } from '../components/NotificationCenter';

export function PortalLayout() {
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // Initialize global real-time connection
  useWebsocket('requests');

  const customerNavigation = [
    { name: 'Dashboard', href: '/portal/customer' },
    { name: 'Requests', href: '/portal/customer/requests' },
    { name: 'Quotes', href: '/portal/customer/quotes' },
    { name: 'Products', href: '/portal/customer/products' },
    { name: 'Cart', href: '/portal/customer/cart' },
    { name: 'Orders', href: '/portal/customer/orders' },
    { name: 'Payments', href: '/portal/customer/payments' },
  ];

  const staffNavigation = [
    { name: 'Back-Office Dashboard', href: '/portal/staff' },
    { name: 'Technician Dashboard', href: '/portal/staff/technician' },
    { name: 'Requests', href: '/portal/staff/requests' },
    { name: 'Bookings', href: '/portal/staff/bookings' },
    { name: 'Inventory', href: '/portal/staff/inventory' },
    { name: 'Products', href: '/portal/staff/products' },
    { name: 'Orders', href: '/portal/staff/orders' },
    { name: 'Payments', href: '/portal/staff/payments' },
  ];

  const technicianNavigation = [
    { name: 'Technician Dashboard', href: '/portal/staff/technician' },
    { name: 'Requests', href: '/portal/staff/technician/requests' },
    { name: 'Profile', href: '/portal/staff/profile' },
  ];

  const managerNavigation = [
    { name: 'Dashboard', href: '/portal/manager' },
    { name: 'Escalations', href: '/portal/manager/requests' },
    { name: 'Bookings', href: '/portal/staff/bookings' },
    { name: 'Technicians', href: '/portal/manager/technicians' },
    { name: 'Inventory', href: '/portal/manager/inventory' },
    { name: 'Payments', href: '/portal/manager/payments' },
    { name: 'Reports', href: '/portal/manager/reports' },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/portal/admin' },
    { name: 'Requests', href: '/portal/staff/requests' },
    { name: 'Inventory', href: '/portal/staff/inventory' },
    { name: 'Products', href: '/portal/staff/products' },
    { name: 'Orders', href: '/portal/staff/orders' },
    { name: 'Payments', href: '/portal/staff/payments' },
    { name: 'Audit Logs', href: '/portal/admin/audit-logs' },
    { name: 'Users', href: '/portal/admin/users' },
    { name: 'Configuration', href: '/portal/admin/configuration' },
    { name: 'System Status', href: '/portal/admin/system-status' },
  ];

  const userRole = user?.role?.toLowerCase() || '';
  
  const navigation = (userRole === 'admin' || userRole === 'super_admin')
    ? adminNavigation
    : userRole === 'manager'
    ? managerNavigation
    : userRole === 'staff'
    ? staffNavigation 
    : userRole === 'technician'
    ? technicianNavigation
    : customerNavigation;

  const isActive = (path: string) => {
    const basePaths = ['/portal/customer', '/portal/staff', '/portal/manager', '/portal/admin'];
    if (basePaths.includes(path) && location.pathname === path) return true;
    if (!basePaths.includes(path) && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex h-screen w-screen bg-[#F3F4F6] font-sans overflow-hidden text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-ess-purple rounded-md flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-sm">
            {/* Image Logo */}
              <div className="group-hover:scale-105 transition-transform duration-100">
                <img 
                  src={logo} 
                  alt="ESS Logo" 
                  className="w-10 h-10 md:w-12 md:h-12 object-contain" 
                />
              </div>
          </div>
          <span className="ml-3 font-semibold text-gray-900 tracking-tight">Portal</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive(item.href)
                    ? 'bg-gray-50 text-ess-purple'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <button 
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center truncate">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-ess-purple font-semibold group-hover:bg-purple-100 flex-shrink-0">
                    {user?.first_name?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                  <div className="ml-3 truncate text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500 truncate">Account</p>
                  </div>
                </div>
                {isAccountMenuOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </button>
              
              {isAccountMenuOpen && (
                <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden py-1 z-10">
                  <Link 
                    to={`/portal/${userRole === 'customer' ? 'customer' : 'staff'}/profile`} 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-ess-purple transition-colors"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    to={`/portal/${userRole === 'customer' ? 'customer' : 'staff'}/settings`} 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-ess-purple transition-colors"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </div>
              )}
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); logout(); }}
              className="w-full flex items-center justify-center px-4 py-2 mt-1 border border-red-200 text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between md:justify-end px-4 md:px-6">
          <div className="flex items-center md:hidden">
             <div className="w-8 h-8 bg-ess-purple rounded-md flex items-center justify-center text-white font-bold text-sm">
                <div className="group-hover:scale-105 transition-transform duration-100">
                  <img 
                    src={logo} 
                    alt="ESS Logo" 
                    className="w-10 h-10 md:w-12 md:h-12 object-contain" 
                  />
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to={`/portal/${userRole === 'customer' ? 'customer' : 'staff'}/settings`} 
              className="text-gray-500 hover:text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <SettingsIcon size={20} />
            </Link>
            <NotificationCenter />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer */}
        <div 
          className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-ess-purple rounded-md flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-sm">
                {/* Image Logo */}
                <div className="group-hover:scale-105 transition-transform duration-100">
                  <img 
                    src={logo} 
                    alt="ESS Logo" 
                    className="w-10 h-10 md:w-12 md:h-12 object-contain" 
                  />
                </div>
              </div>
              <span className="ml-3 font-semibold text-gray-900 tracking-tight">Portal</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ess-purple"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive(item.href) ? 'bg-purple-50 text-ess-purple' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center px-4 py-3 mb-2 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-ess-purple font-semibold shadow-sm">
                {user?.first_name?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div className="ml-3 truncate text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500 truncate">Account Menu</p>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              <Link 
                to={`/portal/${userRole === 'customer' ? 'customer' : 'staff'}/profile`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-ess-purple rounded-lg transition-colors"
              >
                Profile
              </Link>
              <Link 
                to={`/portal/${userRole === 'customer' ? 'customer' : 'staff'}/settings`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-ess-purple rounded-lg transition-colors"
              >
                Settings
              </Link>
            </div>
            <button 
              onClick={() => { logout(); setIsMobileMenuOpen(false); }} 
              className="w-full mt-2 text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#F9FAFB]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
