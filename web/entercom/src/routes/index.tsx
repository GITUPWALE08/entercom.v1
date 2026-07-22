import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { PortalLayout } from '../layouts/PortalLayout';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { GuestRoute } from '../guards/GuestRoute';
import { CustomerGuard, StaffGuard, ManagerGuard, AdminGuard } from '../guards/RoleGuards';
import { RouteError } from '../shared/components/RouteError';
import { LoadingScreen } from '../shared/components/LoadingScreen';

// Eagerly loaded public pages
import Home from '../pages/home';

// Lazy loaded public pages
const Contact = lazy(() => import('../pages/contact'));
const Services = lazy(() => import('../pages/services'));
const Products = lazy(() => import('../pages/products'));
const About = lazy(() => import('../pages/about'));
const Login = lazy(() => import('../pages/login'));
const Register = lazy(() => import('../pages/register'));
const ForgotPassword = lazy(() => import('../pages/forgot-password'));

// Lazy loaded portal pages
const CustomerDashboard = lazy(() => import('../features/portal/customer/Dashboard'));
const RequestList = lazy(() => import('../features/portal/customer/requests/RequestList'));
const CreateRequest = lazy(() => import('../features/portal/customer/requests/CreateRequest'));
const RequestDetail = lazy(() => import('../features/portal/customer/requests/RequestDetail'));
const QuoteDetail = lazy(() => import('../features/portal/customer/quotes/QuoteDetail'));
const ProductList = lazy(() => import('../features/portal/customer/products/ProductList'));
const ProductDetail = lazy(() => import('../features/portal/customer/products/ProductDetail'));
const Cart = lazy(() => import('../features/portal/customer/cart/Cart'));
const Checkout = lazy(() => import('../features/portal/customer/checkout/Checkout'));
const OrderList = lazy(() => import('../features/portal/customer/orders/OrderList'));
const OrderDetail = lazy(() => import('../features/portal/customer/orders/OrderDetail'));
const PaymentList = lazy(() => import('../features/portal/customer/payments/PaymentList'));
const CustomerPaymentDetail = lazy(() => import('../features/portal/customer/payments/CustomerPaymentDetail'));
const Profile = lazy(() => import('../features/portal/customer/profile/Profile'));
const Settings = lazy(() => import('../features/portal/customer/profile/Settings'));

const StaffDashboard = lazy(() => import('../features/portal/staff/Dashboard'));
const TechnicianDashboard = lazy(() => import('../features/portal/staff/TechnicianDashboard'));
const ManagerDashboard = lazy(() => import('../features/portal/manager/ManagerDashboard'));
const ManagerReports = lazy(() => import('../features/portal/manager/Reports'));
const EscalationList = lazy(() => import('../features/portal/manager/requests/EscalationList'));
const ManagerRequestDetail = lazy(() => import('../features/portal/manager/requests/ManagerRequestDetail'));
const TechnicianList = lazy(() => import('../features/portal/manager/technicians/TechnicianList'));

const TechnicianRequestList = lazy(() => import('../features/portal/staff/requests/TechnicianRequestList'));
const TechnicianRequestDetail = lazy(() => import('../features/portal/staff/requests/TechnicianRequestDetail'));
const TechnicianVerification = lazy(() => import('../features/portal/staff/requests/TechnicianVerification'));

const AdminDashboard = lazy(() => import('../features/portal/admin/AdminDashboard'));
const AuditLogList = lazy(() => import('../features/portal/admin/AuditLogList'));
const UserList = lazy(() => import('../features/portal/admin/UserList'));
const Configuration = lazy(() => import('../features/portal/admin/Configuration'));
const SystemStatus = lazy(() => import('../features/portal/admin/SystemStatus'));

const StaffRequestList = lazy(() => import('../features/portal/staff/requests/StaffRequestList'));
const StaffRequestDetail = lazy(() => import('../features/portal/staff/requests/StaffRequestDetail'));
const StaffVerification = lazy(() => import('../features/portal/staff/requests/StaffVerification'));
const StaffBookings = lazy(() => import('../features/portal/staff/bookings/StaffBookings'));
const StaffProductList = lazy(() => import('../features/portal/staff/products/StaffProductList'));
const StaffProductDetail = lazy(() => import('../features/portal/staff/products/StaffProductDetail'));
const StaffInventory = lazy(() => import('../features/portal/staff/products/StaffInventory'));
const StaffOrderList = lazy(() => import('../features/portal/staff/orders/StaffOrderList'));
const StaffOrderDetail = lazy(() => import('../features/portal/staff/orders/StaffOrderDetail'));
const StaffPaymentList = lazy(() => import('../features/portal/staff/payments/StaffPaymentList'));
const StaffPaymentDetail = lazy(() => import('../features/portal/staff/payments/StaffPaymentDetail'));
const StaffInboxPage = lazy(() => import('../features/chat/pages/StaffInboxPage'));

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/services', element: <Suspense fallback={<LoadingScreen/>}><Services /></Suspense> },
      { path: '/products', element: <Suspense fallback={<LoadingScreen/>}><Products /></Suspense> },
      { path: '/about', element: <Suspense fallback={<LoadingScreen/>}><About /></Suspense> },
      { path: '/contact', element: <Suspense fallback={<LoadingScreen/>}><Contact /></Suspense> },
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <Suspense fallback={<LoadingScreen/>}><Login /></Suspense> },
          { path: '/register', element: <Suspense fallback={<LoadingScreen/>}><Register /></Suspense> },
          { path: '/forgot-password', element: <Suspense fallback={<LoadingScreen/>}><ForgotPassword /></Suspense> },
        ]
      }
    ],
  },
  {
    path: '/portal',
    element: <ProtectedRoute />,
    children: [
      {
        element: <PortalLayout />,
        children: [
          // Fallback alias for technicians trying to access /portal/technician directly
          {
            path: 'technician',
            element: <Navigate to="/portal/staff/technician" replace />
          },
          // Customer Portal
          {
            path: 'customer',
            element: <CustomerGuard />,
            children: [
              { index: true, element: <Suspense fallback={<LoadingScreen/>}><CustomerDashboard /></Suspense> },
              { path: 'requests', element: <Suspense fallback={<LoadingScreen/>}><RequestList /></Suspense> },
              { path: 'requests/new', element: <Suspense fallback={<LoadingScreen/>}><CreateRequest /></Suspense> },
              { path: 'requests/:id', element: <Suspense fallback={<LoadingScreen/>}><RequestDetail /></Suspense> },
              { path: 'quotes', element: <div className="p-8">Quotes are tied to specific requests. Please navigate to a request to view its quotes.</div> },
              { path: 'quotes/:requestId/:quoteId', element: <Suspense fallback={<LoadingScreen/>}><QuoteDetail /></Suspense> },
              { path: 'products', element: <Suspense fallback={<LoadingScreen/>}><ProductList /></Suspense> },
              { path: 'products/:id', element: <Suspense fallback={<LoadingScreen/>}><ProductDetail /></Suspense> },
              { path: 'cart', element: <Suspense fallback={<LoadingScreen/>}><Cart /></Suspense> },
              { path: 'checkout', element: <Suspense fallback={<LoadingScreen/>}><Checkout /></Suspense> },
              { path: 'orders', element: <Suspense fallback={<LoadingScreen/>}><OrderList /></Suspense> },
              { path: 'orders/:id', element: <Suspense fallback={<LoadingScreen/>}><OrderDetail /></Suspense> },
              { path: 'payments', element: <Suspense fallback={<LoadingScreen/>}><PaymentList /></Suspense> },
              { path: 'payments/:id', element: <Suspense fallback={<LoadingScreen/>}><CustomerPaymentDetail /></Suspense> },
              { path: 'profile', element: <Suspense fallback={<LoadingScreen/>}><Profile /></Suspense> },
              { path: 'settings', element: <Suspense fallback={<LoadingScreen/>}><Settings /></Suspense> },
            ],
          },
          // Staff Portal
          {
            path: 'staff',
            element: <StaffGuard />,
            children: [
              { index: true, element: <Suspense fallback={<LoadingScreen/>}><StaffDashboard /></Suspense> },
              { path: 'technician', element: <Suspense fallback={<LoadingScreen/>}><TechnicianDashboard /></Suspense> },
              { path: 'technician/requests', element: <Suspense fallback={<LoadingScreen/>}><TechnicianRequestList /></Suspense> },
              { path: 'technician/requests/:id', element: <Suspense fallback={<LoadingScreen/>}><TechnicianRequestDetail /></Suspense> },
              { path: 'technician/requests/:id/verification', element: <Suspense fallback={<LoadingScreen/>}><TechnicianVerification /></Suspense> },
              { path: 'requests', element: <Suspense fallback={<LoadingScreen/>}><StaffRequestList /></Suspense> },
              { path: 'requests/:id', element: <Suspense fallback={<LoadingScreen/>}><StaffRequestDetail /></Suspense> },
              { path: 'requests/:id/verification', element: <Suspense fallback={<LoadingScreen/>}><StaffVerification /></Suspense> },
              { path: 'bookings', element: <Suspense fallback={<LoadingScreen/>}><StaffBookings /></Suspense> },
              { path: 'products', element: <Suspense fallback={<LoadingScreen/>}><StaffProductList /></Suspense> },
              { path: 'products/:id', element: <Suspense fallback={<LoadingScreen/>}><StaffProductDetail /></Suspense> },
              { path: 'inventory', element: <Suspense fallback={<LoadingScreen/>}><StaffInventory /></Suspense> },
              { path: 'orders', element: <Suspense fallback={<LoadingScreen/>}><StaffOrderList /></Suspense> },
              { path: 'orders/:id', element: <Suspense fallback={<LoadingScreen/>}><StaffOrderDetail /></Suspense> },
              { path: 'payments', element: <Suspense fallback={<LoadingScreen/>}><StaffPaymentList /></Suspense> },
              { path: 'payments/:id', element: <Suspense fallback={<LoadingScreen/>}><StaffPaymentDetail /></Suspense> },
              { path: 'inbox', element: <Suspense fallback={<LoadingScreen/>}><StaffInboxPage /></Suspense> },
              { path: 'inbox/:id', element: <Suspense fallback={<LoadingScreen/>}><StaffInboxPage /></Suspense> },
              { path: 'profile', element: <Suspense fallback={<LoadingScreen/>}><Profile /></Suspense> },
              { path: 'settings', element: <Suspense fallback={<LoadingScreen/>}><Settings /></Suspense> },
            ],
          },
          // Manager Portal
          {
            path: 'manager',
            element: <ManagerGuard />,
            children: [
              { index: true, element: <Suspense fallback={<LoadingScreen/>}><ManagerDashboard /></Suspense> },
              { path: 'reports', element: <Suspense fallback={<LoadingScreen/>}><ManagerReports /></Suspense> },
              { path: 'requests', element: <Suspense fallback={<LoadingScreen/>}><EscalationList /></Suspense> },
              { path: 'requests/:id', element: <Suspense fallback={<LoadingScreen/>}><ManagerRequestDetail /></Suspense> },
              { path: 'technicians', element: <Suspense fallback={<LoadingScreen/>}><TechnicianList /></Suspense> },
              { path: 'inventory', element: <Suspense fallback={<LoadingScreen/>}><StaffInventory /></Suspense> },
              { path: 'payments', element: <Suspense fallback={<LoadingScreen/>}><StaffPaymentList /></Suspense> },
              { path: 'payments/:id', element: <Suspense fallback={<LoadingScreen/>}><StaffPaymentDetail /></Suspense> },
            ],
          },
          // Admin Portal
          {
            path: 'admin',
            element: <AdminGuard />,
            children: [
              { index: true, element: <Suspense fallback={<LoadingScreen/>}><AdminDashboard /></Suspense> },
              { path: 'audit-logs', element: <Suspense fallback={<LoadingScreen/>}><AuditLogList /></Suspense> },
              { path: 'users', element: <Suspense fallback={<LoadingScreen/>}><UserList /></Suspense> },
              { path: 'configuration', element: <Suspense fallback={<LoadingScreen/>}><Configuration /></Suspense> },
              { path: 'system-status', element: <Suspense fallback={<LoadingScreen/>}><SystemStatus /></Suspense> },
            ],
          },
        ],
      },
    ],
  },
]);
