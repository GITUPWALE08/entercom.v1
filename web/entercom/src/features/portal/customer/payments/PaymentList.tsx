import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { paymentsApi } from '../../../../api/payments';
import type { PaymentItem } from '../../../../api/payments';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { DataTable } from '../../../../shared/components/ui/DataTable';
import { CreditCard } from 'lucide-react';

export default function PaymentList() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsApi.list,
  });

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="mt-2 text-gray-500 text-lg">Your payment history and invoices.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : payments && payments.length > 0 ? (
          <DataTable 
            data={payments}
            columns={[
              {
                header: 'Transaction ID',
                accessor: (row: PaymentItem) => (
                  <Link to={`/portal/customer/payments/${row.id}`} className="font-mono text-ess-purple hover:underline">
                    {row.id.split('-')[0].toUpperCase()}
                  </Link>
                )
              },
              {
                header: 'Date',
                accessor: (row: PaymentItem) => new Date(row.created_at).toLocaleDateString()
              },
              {
                header: 'Amount',
                accessor: (row: PaymentItem) => <span className="font-medium text-gray-900">${row.amount}</span>
              },
              {
                header: 'Status',
                accessor: (row: PaymentItem) => (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      row.status === 'successful' ? 'bg-green-100 text-green-800' :
                      row.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                    {row.status}
                  </span>
                )
              },
              {
                header: 'Receipt',
                accessor: (row: PaymentItem) => (
                  <button className="font-medium text-gray-400 hover:text-ess-purple transition-colors disabled:opacity-50" disabled={row.status !== 'successful'}>
                    Download
                  </button>
                ),
                className: 'text-right'
              }
            ]}
            keyExtractor={(row) => row.id}
          />
        ) : (
          <EmptyState
            icon={<CreditCard className="w-10 h-10" />}
            title="No payment history"
            description="You don't have any recorded payments yet."
          />
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
