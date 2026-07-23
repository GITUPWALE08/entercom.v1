import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { Users, CheckCircle, XCircle, Eye } from 'lucide-react';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { apiClient } from '../../../../api/axios';
import { toast } from '../../../../shared/components/ui/toastStore';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ensureArray } from '../../../../utils/arrays';

export default function TechnicianList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['technician-applications'],
    queryFn: async () => {
      const res = await apiClient.get('/users/technician-applications/');
      return res.data;
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.patch(`/users/technician-applications/${id}/review/`);
    },
    onSuccess: () => {
      toast.success('Application marked as under review.');
      queryClient.invalidateQueries({ queryKey: ['technician-applications'] });
    }
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      return await apiClient.patch(`/users/technician-applications/${id}/decide/`, { status });
    },
    onSuccess: (_, variables) => {
      toast.success(`Application ${variables.status}.`);
      queryClient.invalidateQueries({ queryKey: ['technician-applications'] });
    }
  });

  const filteredApps = ensureArray(applications).filter((app: any) => 
    filter === 'all' ? true : app.status === filter
  );

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Technician Applications</h1>
            <p className="mt-2 text-gray-500 text-lg">Review and manage technician onboarding.</p>
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border-gray-200 focus:ring-ess-purple focus:border-ess-purple px-4 py-2"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="space-y-4">
            {filteredApps.map((app: any) => (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{app.user_email || 'Unknown User'}</h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md uppercase tracking-wider
                      ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Skills:</strong> {Array.isArray(app.skills) ? app.skills.join(', ') : app.skills}</p>
                    <p><strong>Documents:</strong> {Array.isArray(app.document_urls) ? app.document_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="text-ess-purple hover:underline mr-2">Link {i+1}</a>
                    )) : app.document_urls}</p>
                    {app.notes && <p><strong>Notes:</strong> {app.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                  {app.status === 'pending' && (
                    <button 
                      onClick={() => reviewMutation.mutate(app.id)}
                      disabled={reviewMutation.isPending}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Eye size={18} /> Review
                    </button>
                  )}
                  {(app.status === 'pending' || app.status === 'under_review') && (
                    <>
                      <button 
                        onClick={() => decideMutation.mutate({ id: app.id, status: 'approved' })}
                        disabled={decideMutation.isPending}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-medium rounded-xl hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle size={18} /> Approve
                      </button>
                      <button 
                        onClick={() => decideMutation.mutate({ id: app.id, status: 'rejected' })}
                        disabled={decideMutation.isPending}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={18} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="w-10 h-10" />}
            title="No applications found"
            description={`There are currently no applications with status: ${filter}.`}
          />
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
