import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { paymentsApi } from '../../../../api/payments';
import type { PaymentItem } from '../../../../api/payments';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { DataTable, StatusBadge, Input, Select, Pagination } from '../../../../shared/components/ui';
import { CreditCard } from 'lucide-react';

export default function StaffPaymentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsApi.list,
  });

  const filteredAndSortedPayments = useMemo(() => {
    if (!payments) return [];
    
    let result = payments.filter((payment: PaymentItem) => {
      if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesId = payment.id.toLowerCase().includes(term);
        const matchesOrder = (payment.order_id || '').toLowerCase().includes(term);
        if (!matchesId && !matchesOrder) return false;
      }
      return true;
    });

    result.sort((a: PaymentItem, b: PaymentItem) => {
      if (sortOrder === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

    return result;
  }, [payments, searchTerm, statusFilter, sortOrder]);

  const paginatedPayments = filteredAndSortedPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="mt-2 text-gray-500 text-lg">Monitor transaction statuses and payment history.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input 
            placeholder="Search by Payment or Order ID..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="flex-1"
          />
          <Select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            options={[
              {label: 'All Statuses', value: 'all'},
              {label: 'Pending', value: 'pending'},
              {label: 'Completed', value: 'completed'},
              {label: 'Failed', value: 'failed'},
              {label: 'Cancelled', value: 'cancelled'}
            ]}
            className="w-full sm:w-48"
          />
          <Select 
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
            options={[
              {label: 'Newest First', value: 'date_desc'},
              {label: 'Oldest First', value: 'date_asc'}
            ]}
            className="w-full sm:w-48"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : filteredAndSortedPayments.length > 0 ? (
          <>
            <DataTable
              data={paginatedPayments}
              keyExtractor={(payment) => payment.id}
              columns={[
                {
                  header: 'Payment ID',
                  accessor: (payment) => <span className="font-medium text-gray-900 font-mono text-xs">{payment.id.split('-')[0].toUpperCase()}</span>
                },
                {
                  header: 'Order ID',
                  accessor: (payment) => <span className="text-gray-500 font-mono text-xs">{payment.order_id?.split('-')[0].toUpperCase() || 'N/A'}</span>
                },
                {
                  header: 'Date',
                  accessor: (payment) => new Date(payment.created_at).toLocaleString()
                },
                {
                  header: 'Amount',
                  accessor: (payment) => <span className="font-bold text-gray-900">${parseFloat(payment.amount).toFixed(2)}</span>
                },
                {
                  header: 'Status',
                  accessor: (payment) => <StatusBadge status={payment.status} />
                },
                {
                  header: 'Action',
                  className: 'text-right',
                  accessor: (payment) => (
                    <Link to={`/portal/staff/payments/${payment.id}`} className="font-medium text-ess-purple hover:underline">
                      View Details
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
        ) : (
          <EmptyState
            icon={<CreditCard className="w-10 h-10" />}
            title="No payments found"
            description="Adjust your search or filters to see results."
          />
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
