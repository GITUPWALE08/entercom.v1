import { ensureArray } from '../../../utils/arrays';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import { bookingsApi } from '../../../api/bookings';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAuthStore } from '../../../store/authStore';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { MetricCard } from '../../../shared/components/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';

export default function TechnicianDashboard() {
  const { user } = useAuthStore();
  
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

  const { unreadCount } = useNotifications();

  const assignedRequests = ensureArray(requests).filter((r: any) => r.status === 'assigned' || r.status === 'in_progress') || [];
  const activeJobs = ensureArray(requests).filter((r: any) => r.status === 'in_progress') || [];
  const pendingRequests = ensureArray(requests).filter((r: any) => r.status === 'submitted' || r.status === 'unassigned' || r.status === 'awaiting_assignment' || r.status === 'staff_review') || [];
  const verificationQueue = ensureArray(requests).filter((r: any) => r.status === 'pending_verification') || [];
  const quoteQueue = ensureArray(requests).filter((r: any) => r.status === 'pending_quote_approval' || r.status === 'quote_review' || r.status === 'awaiting_quote') || [];
  const todaysBookings = bookings?.length || 0;

  const isLoading = isLoadingRequests || isLoadingBookings;

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Technician Dashboard</h1>
            <p className="mt-2 text-gray-500 text-lg">Welcome back, {user?.first_name}. Here's what needs your attention.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { refetchRequests(); refetchBookings(); }}
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              disabled={isFetchingRequests || isFetchingBookings}
            >
              <svg className={`w-4 h-4 mr-2 ${isFetchingRequests || isFetchingBookings ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Refresh
            </button>
            {unreadCount > 0 && (
              <Link to="/portal/staff/notifications" className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-xl font-medium border border-red-100 hover:bg-red-100 transition-colors">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                {unreadCount} Unread
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/portal/staff/requests?filter=assigned" className="block">
            <MetricCard title="Assigned Requests" value={ensureArray(assignedRequests).length} />
          </Link>
          <Link to="/portal/staff/bookings" className="block">
            <MetricCard title="Today's Bookings" value={todaysBookings} />
          </Link>
          <Link to="/portal/staff/requests?filter=active" className="block">
            <MetricCard title="Active Jobs" value={ensureArray(activeJobs).length} />
          </Link>
          <Link to="/portal/staff/requests?filter=pending" className="block">
            <MetricCard title="Pending Triage" value={ensureArray(pendingRequests).length} />
          </Link>
          <Link to="/portal/staff/requests?filter=verification" className="block">
            <MetricCard title="Verification Queue" value={ensureArray(verificationQueue).length} />
          </Link>
          <Link to="/portal/staff/requests?filter=quotes" className="block">
            <MetricCard title="Pending Quotes" value={ensureArray(quoteQueue).length} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                <Link to="/portal/staff/requests" className="text-sm font-medium text-ess-purple hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                  </div>
                ) : requests && ensureArray(requests).length > 0 ? (
                  ensureArray(requests).slice(0, 5).map((req: any) => (
                    <Link key={req.id} to={`/portal/staff/requests/${req.id}`} className="block p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-900">{req.public_id || req.id.split('-')[0].toUpperCase()} - {req.category?.replace('_', ' ')}</span>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 capitalize">{req.status?.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{req.description}</p>
                    </Link>
                  ))
                ) : (
                  <div className="p-6">
                    <EmptyState title="No recent activity" description="There are no requests matching your dashboard view." />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/portal/staff/requests" className="block w-full py-3 px-4 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors text-center shadow-sm">
                  Review Pending Requests
                </Link>
                <Link to="/portal/staff/inventory" className="block w-full py-3 px-4 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors text-center shadow-sm">
                  Update Inventory Levels
                </Link>
                <Link to="/portal/staff/orders" className="block w-full py-3 px-4 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors text-center shadow-sm">
                  Fulfill Orders
                </Link>
              </div>
            </div>
          </div>
        </div>

      </PageContainer>
    </ErrorBoundary>
  );
}
