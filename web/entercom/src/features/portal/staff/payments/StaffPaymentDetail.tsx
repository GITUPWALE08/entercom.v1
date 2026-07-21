import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../../../api/payments';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { StatusBadge, Alert, Input } from '../../../../shared/components/ui';
import { useState } from 'react';

export default function StaffPaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsApi.get(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => paymentsApi.cancel(id!, reason),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['payments', id] });
      const previousPayment = queryClient.getQueryData(['payments', id]);
      queryClient.setQueryData(['payments', id], (old: any) => {
        if (!old) return old;
        return { ...old, status: 'cancelled' };
      });
      return { previousPayment };
    },
    onError: (_err, _newTodo, context) => {
      queryClient.setQueryData(['payments', id], context?.previousPayment);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments', id] }),
  });

  const refundMutation = useMutation({
    mutationFn: (reason: string) => paymentsApi.refund(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      setIsRefundModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Refund failed')
  });

  const escalateMutation = useMutation({
    mutationFn: (reason: string) => paymentsApi.escalate(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      setIsEscalateModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Escalation failed')
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

  if (!payment) {
    return <PageContainer><div className="text-center py-12">Payment not found.</div></PageContainer>;
  }

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-6 flex items-center justify-between text-sm">
          <Link to="/portal/staff/payments" className="text-gray-500 hover:text-ess-purple transition-colors">
            &larr; Back to Payments
          </Link>
          <StatusBadge status={payment.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Correlation ID: {payment.id}</h1>
              <p className="text-gray-500 mb-8">Initiated on {new Date(payment.created_at).toLocaleString()}</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                    <p className="font-bold text-gray-900 text-xl">${parseFloat(payment.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Currency</h3>
                    <p className="font-medium text-gray-900">{payment.currency}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Order ID</h3>
                    <Link to={`/portal/staff/orders/${payment.order_id}`} className="font-medium text-ess-purple hover:underline">
                      {payment.order_id ? payment.order_id.split('-')[0].toUpperCase() : 'N/A'}
                    </Link>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-gray-900">Receipt Details</h3>
                  <p className="text-sm text-gray-500">Transaction ID: <span className="font-mono text-gray-900">{payment.id}</span></p>
                  {payment.authorization_url && (
                    <p className="text-sm text-gray-500">Auth URL: <a href={payment.authorization_url} target="_blank" rel="noopener noreferrer" className="text-ess-purple hover:underline break-all">{payment.authorization_url}</a></p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Actions</h2>
              
              <div className="space-y-4">
                {payment.status === 'pending' && (
                  <>
                    {payment.authorization_url && (
                      <a 
                        href={payment.authorization_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full py-3 px-4 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors text-center shadow-sm"
                      >
                        Pay Now
                      </a>
                    )}
                    <button 
                      onClick={() => setIsCancelModalOpen(true)}
                      disabled={cancelMutation.isPending}
                      className="w-full py-3 px-4 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Cancel Payment
                    </button>
                    <p className="text-gray-500 text-xs text-center">Cancelling will mark this payment as aborted.</p>
                  </>
                )}
                
                {payment.status === 'completed' || payment.status === 'paid' ? (
                  <div className="space-y-4">
                    <Alert 
                      type="success"
                      title="Payment Completed"
                      description="This payment has been fully processed and verified."
                    />
                    <button 
                      onClick={() => setIsRefundModalOpen(true)}
                      className="w-full py-3 px-4 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Request Refund
                    </button>
                  </div>
                ) : null}
                
                {payment.status === 'cancelled' && (
                  <Alert 
                    type="error"
                    title="Payment Cancelled"
                    description="This payment was cancelled or aborted."
                  />
                )}

                {payment.status === 'refunded' && (
                  <Alert 
                    type="error"
                    title="Payment Refunded"
                    description="This payment has been refunded to the customer."
                  />
                )}

                {payment.status === 'escalated' && (
                  <Alert 
                    type="warning"
                    title="Payment Escalated"
                    description="This payment is currently under review by management."
                  />
                )}

                {(payment.status === 'pending' || payment.status === 'failed') && (
                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setIsEscalateModalOpen(true)}
                      className="w-full py-3 px-4 bg-white border border-orange-300 text-orange-700 font-medium rounded-xl hover:bg-orange-50 transition-colors"
                    >
                      Escalate Issue
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isCancelModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Payment</h2>
              <p className="text-gray-500 text-sm mb-6">Please provide a reason for cancelling this payment.</p>
              
              <div className="space-y-4">
                <Input 
                  label="Cancellation Reason"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. User requested, duplicate order..."
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

        {isRefundModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Refund Payment</h2>
              <p className="text-gray-500 text-sm mb-6">Please provide a reason for refunding this payment.</p>
              
              <div className="space-y-4">
                <Input 
                  label="Refund Reason"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="e.g. Overcharged, customer requested..."
                  required
                />
                
                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button"
                    onClick={() => { setIsRefundModalOpen(false); setRefundReason(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Close
                  </button>
                  <button 
                    type="button"
                    onClick={() => refundMutation.mutate(refundReason)}
                    disabled={!refundReason || refundMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    Confirm Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isEscalateModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Escalate Payment</h2>
              <p className="text-gray-500 text-sm mb-6">Escalate this payment to management for review.</p>
              
              <div className="space-y-4">
                <Input 
                  label="Escalation Reason"
                  value={escalateReason}
                  onChange={e => setEscalateReason(e.target.value)}
                  placeholder="e.g. Fraud suspected, stuck in pending..."
                  required
                />
                
                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button"
                    onClick={() => { setIsEscalateModalOpen(false); setEscalateReason(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Close
                  </button>
                  <button 
                    type="button"
                    onClick={() => escalateMutation.mutate(escalateReason)}
                    disabled={!escalateReason || escalateMutation.isPending}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    Escalate
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
