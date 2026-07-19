import { ensureArray } from '../../../utils/arrays';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import { paymentsApi } from '../../../api/payments';
import { useAuthStore } from '../../../store/authStore';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { MetricCard } from '../../../shared/components/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';

export default function StaffDashboard() {
  const { user } = useAuthStore();
  
  const { data: requests, isLoading: isLoadingRequests, refetch: refetchRequests, isFetching: isFetchingRequests } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
    refetchInterval: 30000,
  });

  const { data: payments, isLoading: isLoadingPayments, refetch: refetchPayments, isFetching: isFetchingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsApi.list,
    refetchInterval: 60000,
  });

  const allRequests = ensureArray(requests);
  const allPayments = ensureArray(payments);

  const newRequests = allRequests.filter((r: any) => r.status === 'submitted');
  const emergencyQueue = allRequests.filter((r: any) => r.priority === 'emergency' && r.status !== 'completed' && r.status !== 'cancelled');
  const unassignedRequests = allRequests.filter((r: any) => r.status === 'unassigned' || r.status === 'awaiting_assignment');
  
  // SLA Risk: Emergency not assigned within 1 hour, or High not assigned within 4 hours. 
  // We'll approximate by checking unassigned + priority.
  const slaRisks = allRequests.filter((r: any) => 
    (r.status === 'submitted' || r.status === 'unassigned' || r.status === 'awaiting_assignment') && 
    (r.priority === 'emergency' || r.priority === 'high')
  );

  const failedPayments = allPayments.filter((p: any) => p.status === 'failed');

  const isLoading = isLoadingRequests || isLoadingPayments;
  const isFetching = isFetchingRequests || isFetchingPayments;

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
              onClick={() => { refetchRequests(); refetchPayments(); }}
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              disabled={isFetching}
            >
              <svg className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link to="/portal/staff/requests" className="block">
            <MetricCard title="New Requests" value={newRequests.length} />
          </Link>
          <Link to="/portal/staff/requests?filter=emergency" className="block">
            <MetricCard title="Emergency Queue" value={emergencyQueue.length} />
          </Link>
          <Link to="/portal/staff/requests?filter=unassigned" className="block">
            <MetricCard title="Unassigned" value={unassignedRequests.length} />
          </Link>
          <Link to="/portal/staff/requests?filter=sla_risk" className="block">
            <MetricCard title="SLA Risk" value={slaRisks.length} />
          </Link>
          <Link to="/portal/staff/payments?filter=failed" className="block">
            <MetricCard title="Failed Payments" value={failedPayments.length} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emergency & SLA Risks */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div className="p-6 border-b border-red-100 flex justify-between items-center bg-red-50">
              <h2 className="text-lg font-bold text-red-900">Urgent Attention Required</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : slaRisks.length > 0 || emergencyQueue.length > 0 ? (
                [...new Set([...emergencyQueue, ...slaRisks])].slice(0, 5).map((req: any) => (
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

          {/* Failed Payments */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Failed Payments</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : failedPayments.length > 0 ? (
                failedPayments.slice(0, 5).map((pay: any) => (
                  <Link key={pay.id} to={`/portal/staff/payments/${pay.id}`} className="block p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{pay.reference || pay.id.split('-')[0].toUpperCase()}</span>
                      <span className="font-bold text-gray-900">₦{parseFloat(pay.amount).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-red-600 font-medium">Failed — Action Required</p>
                  </Link>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState title="No failed payments" description="All recent transactions were successful." />
                </div>
              )}
            </div>
          </div>
        </div>

      </PageContainer>
    </ErrorBoundary>
  );
}
