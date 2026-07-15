import { useState, useMemo } from 'react';
import { PackageCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../../../api/orders';

import { PageContainer } from '../../../../shared/components/PageContainer';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { DataTable, StatusBadge, Input, Select, Pagination } from '../../../../shared/components/ui';

export default function StaffOrderList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.list,
  });

  const filteredAndSortedOrders = useMemo(() => {
    if (!orders) return [];
    
    let result = orders.filter((order: any) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(term);
        if (!matchesId) return false;
      }
      return true;
    });

    result.sort((a: any, b: any) => {
      if (sortOrder === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

    return result;
  }, [orders, searchTerm, statusFilter, sortOrder]);

  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="mt-2 text-gray-500 text-lg">Manage and fulfill customer orders.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input 
            placeholder="Search by Order ID..." 
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
              {label: 'Processing', value: 'processing'},
              {label: 'Shipped', value: 'shipped'},
              {label: 'Delivered', value: 'delivered'},
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
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : filteredAndSortedOrders.length > 0 ? (
          <>
            <DataTable
              data={paginatedOrders}
              keyExtractor={(order) => order.id}
              columns={[
                {
                  header: 'Order ID',
                  accessor: (order) => <span className="font-medium text-gray-900">{order.id.split('-')[0].toUpperCase()}</span>
                },
                {
                  header: 'Date',
                  accessor: (order) => new Date(order.created_at).toLocaleDateString()
                },
                {
                  header: 'Total',
                  accessor: (order) => <span className="font-bold text-gray-900">${parseFloat(order.total_amount).toFixed(2)}</span>
                },
                {
                  header: 'Status',
                  accessor: (order) => <StatusBadge status={order.status} />
                },
                {
                  header: 'Action',
                  className: 'text-right',
                  accessor: (order) => (
                    <Link to={`/portal/staff/orders/${order.id}`} className="font-medium text-ess-purple hover:underline">
                      Manage
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
            icon={<PackageCheck className="w-10 h-10" />}
            title="No orders found"
            description="Adjust your search or filters to see results."
          />
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
