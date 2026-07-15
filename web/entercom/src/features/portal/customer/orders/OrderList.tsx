import { Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../../../api/orders';
import type { OrderItem } from '../../../../api/orders';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { DataTable } from '../../../../shared/components/ui/DataTable';

export default function OrderList() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.list,
  });

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order History</h1>
          <p className="mt-2 text-gray-500 text-lg">Hardware purchases for your installations.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : orders && orders.length > 0 ? (
          <DataTable 
            data={orders}
            columns={[
              { 
                header: 'Order ID', 
                accessor: (row: OrderItem) => row.id.split('-')[0].toUpperCase() 
              },
              { 
                header: 'Date', 
                accessor: (row: OrderItem) => new Date(row.created_at).toLocaleDateString() 
              },
              { 
                header: 'Status', 
                accessor: (row: OrderItem) => (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      row.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                      row.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                    {row.status.replace('_', ' ')}
                  </span>
                ) 
              },
              { 
                header: 'Total', 
                accessor: (row: OrderItem) => `$${row.total_amount}` 
              },
              { 
                header: 'Action', 
                accessor: (row: OrderItem) => (
                  <Link to={`/portal/customer/orders/${row.id}`} className="font-medium text-ess-purple hover:underline block text-right">
                    View details
                  </Link>
                ),
                className: 'text-right'
              }
            ]}
            keyExtractor={(row) => row.id}
          />
        ) : (
          <EmptyState
            icon={<Package className="w-10 h-10" />}
            title="No orders yet"
            description="You haven't placed any orders. Approved quotes will appear here."
            action={
              <Link 
                to="/portal/customer/requests" 
                className="inline-flex justify-center items-center px-6 py-2.5 bg-ess-purple text-white text-sm font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm"
              >
                View Requests
              </Link>
            }
          />)}
      </PageContainer>
    </ErrorBoundary>
  );
}
