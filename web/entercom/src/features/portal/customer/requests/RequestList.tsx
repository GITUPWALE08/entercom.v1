import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { requestsApi } from '../../../../api/requests';
import type { RequestItem } from '../../../../api/requests';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { Card, CardContent, StatusBadge } from '../../../../shared/components/ui';
import { ClipboardList } from 'lucide-react';

export default function RequestList() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
  });

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Service Requests</h1>
            <p className="mt-1 text-sm text-gray-500">Track and manage your installations and service calls.</p>
          </div>
          <Link 
            to="/portal/customer/requests/new" 
            className="inline-flex justify-center items-center px-4 py-2 bg-ess-purple text-white text-sm font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm"
          >
            New Request
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req: RequestItem) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {req.title || req.service_type?.replace('_', ' ') || 'Service Request'}
                        </h3>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-gray-500">
                      ID: {req.public_id || req.id.split('-')[0]} • Created on {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/portal/customer/requests/${req.id}`}
                      className="text-sm font-medium text-ess-purple hover:text-ess-darkPurple"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ClipboardList className="w-10 h-10" />}
            title="No requests yet"
            description="You haven't made any service requests. Start by creating a new one to get a quote."
            action={
              <Link 
                to="/portal/customer/requests/new" 
                className="inline-flex justify-center items-center px-6 py-2.5 bg-ess-purple text-white text-sm font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm"
              >
                Create Request
              </Link>
            }
          />
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
