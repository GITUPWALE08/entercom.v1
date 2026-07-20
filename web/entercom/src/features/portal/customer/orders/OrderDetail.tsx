import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../../../api/orders';
import { paymentsApi } from '../../../../api/payments';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { DataTable } from '../../../../shared/components/ui/DataTable';
// import { StatusBadge } from '../../../../shared/components/ui/StatusBadge';
import { Card, CardContent} from '../../../../shared/components/ui';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const isMockPayment = queryParams.get('mock_payment') === 'true';
  const paymentReference = queryParams.get('reference');

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.get(id!),
    enabled: !!id,
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsApi.list,
  });

  const orderPayment = payments?.find((p: any) => p.order_id === id);

  const cancelOrderMutation = useMutation({
    mutationFn: (reason: string) => ordersApi.cancel(id!, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', id] }),
  });

  const paymentMutation = useMutation({
    mutationFn: paymentsApi.initialize,
    onSuccess: (paymentData) => {
      if (paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
      } else {
        alert("Payment initialization failed. Please try again.");
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to initialize payment.');
    }
  });

  const simulateWebhookMutation = useMutation({
    mutationFn: (ref: string) => paymentsApi.simulateWebhook(ref),
    onSuccess: () => {
      alert("Mock payment successful!");
      navigate(`/portal/customer/orders/${id}`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to simulate payment webhook.');
    }
  });

  if (isLoading) {
    return <PageContainer><Skeleton className="h-96 w-full rounded-2xl" /></PageContainer>;
  }

  if (!order) {
    return <PageContainer><div className="text-center py-12">Order not found.</div></PageContainer>;
  }

  // Cast since we added items to the schema manually in thoughts but maybe not in api type, assuming it's any for now
  const orderData = order as any;

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-6 flex items-center text-sm text-gray-500">
          <Link to="/portal/customer/orders" className="hover:text-ess-purple transition-colors">Orders</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{orderData.request_id.split('-')[0].toUpperCase()}</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-12 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reference #{orderData.request_id.split('-')[0].toUpperCase()}</h1>
              <p className="text-gray-500">Placed on {new Date(orderData.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize mb-2
                ${orderData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  orderData.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                  orderData.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                {orderData.status.replace('_', ' ')}
              </span>
              <p className="font-bold text-2xl text-gray-900">${orderData.total_amount}</p>
              {(orderData.status === 'pending_payment' || orderData.status === 'pending') && (
                <div className="mt-3 flex flex-col sm:flex-row justify-end items-center gap-3">
                  {isMockPayment && paymentReference ? (
                    <button
                      onClick={() => simulateWebhookMutation.mutate(paymentReference)}
                      disabled={simulateWebhookMutation.isPending}
                      className="inline-flex justify-center w-full sm:w-auto items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                    >
                      {simulateWebhookMutation.isPending ? 'Simulating...' : 'Simulate Payment Success'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          const reason = prompt("Please provide a reason for cancelling this order:");
                          if (reason) {
                            cancelOrderMutation.mutate(reason);
                          }
                        }}
                        disabled={cancelOrderMutation.isPending}
                        className="inline-flex justify-center w-full sm:w-auto items-center px-4 py-2 border border-red-200 rounded-lg shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                      >
                        {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                      <button
                        onClick={() => paymentMutation.mutate({ order_id: id! })}
                        disabled={paymentMutation.isPending}
                        className="inline-flex justify-center w-full sm:w-auto items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-ess-purple hover:bg-ess-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ess-purple disabled:opacity-50 transition-colors"
                      >
                        {paymentMutation.isPending ? 'Redirecting...' : 'Pay Now'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-8 sm:p-12">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Items</h2>
            
            <div className="mt-4">
              <DataTable 
                data={orderData.items || []}
                columns={[
                  {
                    header: 'Product',
                    accessor: (row: any) => <p className="font-medium text-gray-900">{row.product_name}</p>
                  },
                  {
                    header: 'Price',
                    accessor: (row: any) => `$${row.unit_price}`,
                    className: 'text-right'
                  },
                  {
                    header: 'Qty',
                    accessor: 'quantity',
                    className: 'text-center'
                  },
                  {
                    header: 'Total',
                    accessor: (row: any) => <span className="font-medium text-gray-900">${row.line_total}</span>,
                    className: 'text-right'
                  }
                ]}
                keyExtractor={(row: any) => row.product_id || Math.random().toString()}
              />
            </div>
          </div>
          
          <div className="bg-gray-50 p-8 sm:p-12 flex flex-col sm:flex-row justify-between items-center gap-6">
             {/* <div className="flex flex-col gap-2">
               <div className="text-sm text-gray-500">
                 Attached to Request: <Link to={`/portal/customer/requests/${orderData.request_id}`} className="text-ess-purple hover:underline font-medium">{orderData.request_id.split('-')[0].toUpperCase()}</Link>
               </div>
               {orderPayment && (
                 <div className="text-sm text-gray-500">
                   Attached Payment: <Link to={`/portal/customer/payments/${orderPayment.id}`} className="text-ess-purple hover:underline font-medium">{orderPayment.id.split('-')[0].toUpperCase()}</Link>
                 </div>
               )}
             </div> */}

             {/* Associated Order / Payment */}
                         {(orderData.request_id || orderPayment.id) && (
                           <Card>
                             <CardContent>
                               <h2 className="text-lg font-semibold text-gray-900 mb-4">Associated Request & Payment</h2>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                 {orderData.request_id && (
                                   <div>
                                     <h3 className="text-sm font-medium text-gray-500 mb-1">Request</h3>
                                     <div className="flex items-center gap-3">
                                       <Link 
                                         to={`/portal/customer/requests/${orderData.request_id}`}
                                         className="text-sm font-medium text-ess-purple hover:underline"
                                       >
                                         View Request
                                       </Link>
                                     </div>
                                   </div>
                                 )}
                                 {orderPayment.id && (
                                   <div>
                                     <h3 className="text-sm font-medium text-gray-500 mb-1">Payment</h3>
                                     <div className="flex items-center gap-3">
                                       <Link 
                                         to={`/portal/customer/payments/${orderPayment.id}`}
                                         className="text-sm font-medium text-ess-purple hover:underline"
                                       >
                                         View Payment
                                       </Link>
                                     </div>
                                   </div>
                                 )}
                               </div>
                             </CardContent>
                           </Card>
                         )}
             
             {/* Note: Invoices would go here if backend supported them */}
             <button className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
               Download Receipt
             </button>
          </div>
        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
