import { ensureArray } from '../../../utils/arrays';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import { bookingsApi } from '../../../api/bookings';
import { productsApi } from '../../../api/products';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAuthStore } from '../../../store/authStore';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { MetricCard } from '../../../shared/components/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const { unreadCount } = useNotifications();
  
  const { data: requests, isLoading: isLoadingRequests, refetch: refetchRequests, isFetching: isFetchingRequests } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
    refetchInterval: 30000,
  });

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const { data: bookings, isLoading: isLoadingBookings, refetch: refetchBookings, isFetching: isFetchingBookings } = useQuery({
    queryKey: ['bookings', today],
    queryFn: () => bookingsApi.list({ start_date: today, end_date: tomorrow }),
    refetchInterval: 30000,
  });

  const { data: products, isLoading: isLoadingProducts, refetch: refetchProducts, isFetching: isFetchingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
    refetchInterval: 60000,
  });

  const allRequests = ensureArray(requests);
  
  const pendingRequests = allRequests.filter((r: any) => ['submitted', 'unassigned', 'awaiting_assignment', 'staff_review'].includes(r.status));
  const activeRequests = allRequests.filter((r: any) => ['assigned', 'in_progress', 'pending_verification'].includes(r.status));
  const pendingQuotes = allRequests.filter((r: any) => ['pending_quote_approval', 'quote_review', 'awaiting_quote'].includes(r.status));
  
  const todaysBookings = bookings?.length || 0;
  
  const inventoryAlerts = ensureArray(products).filter((p: any) => 
    p.status !== 'archived' && (p.quantity_available <= (p.low_stock_threshold || 5) || p.status === 'out_of_stock')
  );

  const slaRisks = allRequests.filter((r: any) => 
    (r.status === 'submitted' || r.status === 'unassigned' || r.status === 'awaiting_assignment') && 
    (r.priority === 'emergency' || r.priority === 'high')
  );

  const isLoading = isLoadingRequests || isLoadingBookings || isLoadingProducts;
  const isFetching = isFetchingRequests || isFetchingBookings || isFetchingProducts;

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff Dashboard</h1>
            <p className="mt-2 text-gray-500 text-lg">Back-office overview for {user?.first_name}.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { refetchRequests(); refetchBookings(); refetchProducts(); }}
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              disabled={isFetching}
            >
              <svg className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Link to="/portal/staff/requests?filter=pending" className="block">
            <MetricCard title="Pending Requests" value={pendingRequests.length} />
          </Link>
          <Link to="/portal/staff/requests?filter=active" className="block">
            <MetricCard title="Active Requests" value={activeRequests.length} />
          </Link>
          <Link to="/portal/staff/requests?filter=quotes" className="block">
            <MetricCard title="Pending Quotes" value={pendingQuotes.length} />
          </Link>
          <Link to="/portal/staff/bookings" className="block">
            <MetricCard title="Bookings Today" value={todaysBookings} />
          </Link>
          <Link to="/portal/staff/inventory" className="block">
            <MetricCard title="Inventory Alerts" value={inventoryAlerts.length} />
          </Link>
          <Link to="/portal/staff/settings" className="block">
            <MetricCard title="Notifications" value={unreadCount} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SLA Risks */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div className="p-6 border-b border-red-100 flex justify-between items-center bg-red-50">
              <h2 className="text-lg font-bold text-red-900">Urgent Attention Required</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : slaRisks.length > 0 ? (
                slaRisks.slice(0, 5).map((req: any) => (
                  <Link key={req.id} to={`/portal/staff/requests/${req.id}`} className="block p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{req.public_id || req.id.split('-')[0].toUpperCase()}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase tracking-wide">
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{req.description}</p>
                  </Link>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState title="No urgent requests" description="Everything is running smoothly." />
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
            <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-50">
              <h2 className="text-lg font-bold text-orange-900">Inventory Alerts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : inventoryAlerts.length > 0 ? (
                inventoryAlerts.slice(0, 5).map((item: any) => (
                  <Link key={item.id} to={`/portal/staff/inventory`} className="block p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{item.name}</span>
                      <span className="font-bold text-orange-700">{item.quantity_available} left</span>
                    </div>
                    <p className="text-sm text-orange-600 font-medium">{item.status === 'out_of_stock' ? 'Out of stock' : 'Low stock warning'}</p>
                  </Link>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState title="Inventory is healthy" description="No low stock items." />
                </div>
              )}
            </div>
          </div>
        </div>

      </PageContainer>
    </ErrorBoundary>
  );
}

