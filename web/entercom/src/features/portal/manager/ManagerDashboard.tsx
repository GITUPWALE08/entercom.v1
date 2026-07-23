import { ensureArray } from '../../../utils/arrays';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import { productsApi } from '../../../api/products';
import { ordersApi } from '../../../api/orders';
import { paymentsApi } from '../../../api/payments';
import { useAuthStore } from '../../../store/authStore';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { MetricCard } from '../../../shared/components/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  
  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.list,
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsApi.list,
  });

  const escalatedRequests = ensureArray(requests).filter(r => r.status === 'escalated') || [];
  const openRequests = ensureArray(requests).filter(r => r.status !== 'completed' && r.status !== 'cancelled') || [];
  const inventoryAlerts = ensureArray(products).filter(p => p.quantity_available <= (p.low_stock_threshold || 10)) || [];
  const pendingOrders = ensureArray(orders).filter(o => o.status === 'pending') || [];
  const pendingPayments = ensureArray(payments).filter(p => p.status === 'pending') || [];

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manager Dashboard</h1>
          <p className="mt-2 text-gray-500 text-lg">Welcome back, {user?.first_name}. Here is the overview of operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link to="/portal/manager/requests?filter=escalated" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Escalated" value={ensureArray(escalatedRequests).length} />
          </Link>
          <Link to="/portal/manager/requests" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Open Requests" value={ensureArray(openRequests).length} />
          </Link>
          <Link to="/portal/manager/inventory?filter=alerts" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Inventory Alerts" value={ensureArray(inventoryAlerts).length} />
          </Link>
          <Link to="/portal/manager/orders?filter=pending" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Pending Orders" value={ensureArray(pendingOrders).length} />
          </Link>
          <Link to="/portal/manager/payments?filter=pending" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Pending Payments" value={ensureArray(pendingPayments).length} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Escalations List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Recent Escalations</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {loadingRequests ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : ensureArray(escalatedRequests).length > 0 ? (
                escalatedRequests.slice(0, 5).map(req => (
                  <Link key={req.id} to={`/portal/manager/requests/${req.id}`} className="block p-6 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{req.public_id || req.id.split('-')[0].toUpperCase()}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{req.description}</p>
                  </Link>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState title="No Escalations" description="No escalations requiring attention." />
                </div>
              )}
            </div>
          </div>

          {/* Inventory Alerts List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Inventory Alerts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {loadingProducts ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : ensureArray(inventoryAlerts).length > 0 ? (
                inventoryAlerts.slice(0, 5).map(prod => (
                  <Link key={prod.id} to={`/portal/manager/products/${prod.id}`} className="block p-6 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{prod.name}</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        {prod.quantity_available} in stock
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Threshold: {prod.low_stock_threshold || 10}</p>
                  </Link>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState title="Healthy Inventory" description="Inventory levels are healthy." />
                </div>
              )}
            </div>
          </div>
        </div>

      </PageContainer>
    </ErrorBoundary>
  );
}
