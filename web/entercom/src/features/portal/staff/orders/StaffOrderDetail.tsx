import { ensureArray } from '../../../../utils/arrays';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../../../api/orders';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { StatusBadge, Alert, Input } from '../../../../shared/components/ui';
import { useState } from 'react';

export default function StaffOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.get(id!),
    enabled: !!id,
  });

  const fulfillMutation = useMutation({
    mutationFn: () => ordersApi.fulfill(id!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['orders', id] });
      const previousOrder = queryClient.getQueryData(['orders', id]);
      queryClient.setQueryData(['orders', id], (old: any) => {
        if (!old) return old;
        return { ...old, status: 'completed' };
      });
      return { previousOrder };
    },
    onError: (_err, _newTodo, context) => {
      queryClient.setQueryData(['orders', id], context?.previousOrder);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', id] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => ordersApi.cancel(id!, reason),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['orders', id] });
      const previousOrder = queryClient.getQueryData(['orders', id]);
      queryClient.setQueryData(['orders', id], (old: any) => {
        if (!old) return old;
        return { ...old, status: 'cancelled' };
      });
      return { previousOrder };
    },
    onError: (_err, _newTodo, context) => {
      queryClient.setQueryData(['orders', id], context?.previousOrder);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', id] }),
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!order) {
    return <PageContainer><div className="text-center py-12">Order not found.</div></PageContainer>;
  }

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-6 flex items-center justify-between text-sm">
          <Link to="/portal/staff/orders" className="text-gray-500 hover:text-ess-purple transition-colors">
            &larr; Back to Orders
          </Link>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order {order.id.split('-')[0].toUpperCase()}</h1>
              <p className="text-gray-500 mb-8">Placed on {new Date(order.created_at).toLocaleString()}</p>
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Items</h3>
                {order.ensureArray(items).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name || `Product ID: ${item.product_id}`}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}</p>
                    </div>
                    <span className="font-bold text-gray-900">${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-lg">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="font-bold text-ess-purple">${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Fulfillment Actions</h2>
              
              <div className="space-y-4">
                {order.status === 'paid' && (
                  <>
                    <button 
                      onClick={() => fulfillMutation.mutate()}
                      disabled={fulfillMutation.isPending}
                      className="w-full py-3 px-4 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm disabled:opacity-50"
                    >
                      {fulfillMutation.isPending ? 'Fulfilling...' : 'Mark as Fulfilled'}
                    </button>
                    <button 
                      onClick={() => setIsCancelModalOpen(true)}
                      disabled={cancelMutation.isPending}
                      className="w-full py-3 px-4 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                
                {['pending', 'draft'].includes(order.status) && (
                  <p className="text-gray-500 text-sm">Order is awaiting payment. No fulfillment actions available yet.</p>
                )}

                {order.status === 'completed' && (
                  <Alert 
                    type="success"
                    title="Order Fulfilled"
                    description="This order has been successfully fulfilled."
                  />
                )}
                
                {order.status === 'cancelled' && (
                  <Alert 
                    type="error"
                    title="Order Cancelled"
                    description="This order was cancelled."
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {isCancelModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Order</h2>
              <p className="text-gray-500 text-sm mb-6">Please provide a reason for cancelling this order.</p>
              
              <div className="space-y-4">
                <Input 
                  label="Cancellation Reason"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Out of stock, customer requested..."
                  required
                />
                
                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button"
                    onClick={() => { setIsCancelModalOpen(false); setCancelReason(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Close
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (cancelReason) {
                        cancelMutation.mutate(cancelReason);
                        setIsCancelModalOpen(false);
                      }
                    }}
                    disabled={!cancelReason || cancelMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
