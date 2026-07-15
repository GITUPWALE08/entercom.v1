import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { requestsApi } from '../../../../api/requests';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { DataTable, StatusBadge, Input, Select, Pagination } from '../../../../shared/components/ui';

export default function StaffRequestList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
  });

  const filteredAndSortedRequests = useMemo(() => {
    if (!requests) return [];
    
    let result = requests.filter((req: any) => {
      // Tab Filters
      if (filterParam === 'assigned' && !['assigned', 'in_progress'].includes(req.status)) return false;
      if (filterParam === 'pending' && !['submitted', 'unassigned', 'awaiting_assignment', 'staff_review'].includes(req.status)) return false;
      if (filterParam === 'verification' && req.status !== 'pending_verification') return false;
      if (filterParam === 'quotes' && !['pending_quote_approval', 'quote_review', 'awaiting_quote'].includes(req.status)) return false;
      
      // Search Term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesId = (req.public_id || req.id).toLowerCase().includes(term);
        const matchesCategory = (req.category || '').toLowerCase().includes(term);
        if (!matchesId && !matchesCategory) return false;
      }
      return true;
    });

    // Sorting
    result.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [requests, filterParam, searchTerm, sortOrder]);

  const paginatedRequests = filteredAndSortedRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredAndSortedRequests.length / itemsPerPage);

  const handleTabChange = (f: string) => {
    setSearchParams({ filter: f });
    setCurrentPage(1);
  };

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Requests</h1>
            <p className="mt-2 text-gray-500 text-lg">Manage and triage customer service requests.</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar border-b border-gray-100">
          {['all', 'assigned', 'pending', 'verification', 'quotes'].map(f => (
            <button
              key={f}
              onClick={() => handleTabChange(f)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${
                filterParam === f 
                  ? 'bg-ess-navy text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input 
            placeholder="Search by ID or Category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select 
            options={[{label: 'Newest First', value: 'newest'}, {label: 'Oldest First', value: 'oldest'}]}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : (
          <>
            <DataTable
              data={paginatedRequests}
              keyExtractor={(req) => req.id}
              emptyTitle="No pending requests"
              emptyDescription="All service requests matching your filters have been handled. Good job!"
              columns={[
              {
                header: 'Request ID',
                accessor: (req) => <span className="font-medium text-gray-900">{req.public_id || req.id.split('-')[0].toUpperCase()}</span>
              },
              {
                header: 'Category',
                accessor: (req) => <span className="capitalize">{req.service_type?.replace('_', ' ') || req.category?.replace('_', ' ') || 'Unknown'}</span>
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
                )
              },
              {
                header: 'Status',
                accessor: (req) => <StatusBadge status={req.status} />
              },
              {
                header: 'Created',
                accessor: (req) => req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'
              },
              {
                header: 'Action',
                className: 'text-right',
                accessor: (req) => (
                  <Link to={`/portal/staff/requests/${req.id}`} className="font-medium text-ess-purple hover:underline">
                    View details
                  </Link>
                )
              }
            ]}
            />
            
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
