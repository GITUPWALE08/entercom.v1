import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { requestsApi } from '../../../../api/requests';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { DataTable } from '../../../../shared/components/ui/DataTable';
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge';

export default function EscalationList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';

  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
  });

  // For manager escalation queue, we only want to show escalated requests by default,
  // or open requests requiring attention.
  const filteredRequests = requests?.filter(req => {
    if (filterParam === 'escalated') return req.status === 'escalated';
    if (filterParam === 'open') return req.status !== 'completed' && req.status !== 'cancelled';
    return true; // 'all'
  });

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Escalations & Requests</h1>
            <p className="mt-2 text-gray-500 text-lg">Manage escalations and oversee all customer requests.</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
          {['escalated', 'open', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setSearchParams({ filter: f })}
              className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${
                filterParam === f 
                  ? 'bg-ess-navy text-white' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : (
          <DataTable
            data={filteredRequests || []}
            keyExtractor={(req) => req.id}
            emptyTitle="No escalations"
            emptyDescription="There are no requests matching this criteria."
            columns={[
              {
                header: 'Request ID',
                accessor: (req) => <span className="font-medium text-gray-900">{req.public_id || req.id.split('-')[0].toUpperCase()}</span>,
              },
              {
                header: 'Category',
                accessor: (req) => <span className="capitalize">{req.service_type?.replace('_', ' ') || req.category?.replace('_', ' ') || 'Unknown'}</span>,
              },
              {
                header: 'Priority',
                accessor: (req) => (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                    ${req.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      req.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {req.priority || 'Normal'}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: (req) => <StatusBadge status={req.status} />,
              },
              {
                header: 'Created',
                accessor: (req) => req.created_at ? new Date(req.created_at).toLocaleDateString() : '-',
              },
              {
                header: 'Action',
                accessor: (req) => (
                  <Link to={`/portal/manager/requests/${req.id}`} className="font-medium text-ess-purple hover:underline">
                    View details
                  </Link>
                ),
                className: 'text-right',
              },
            ]}
          />
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
