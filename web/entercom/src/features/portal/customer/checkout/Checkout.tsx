import { ensureArray } from '../../../../utils/arrays';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCartStore } from '../../../../store/cartStore';
import { requestsApi } from '../../../../api/requests';
import { ordersApi } from '../../../../api/orders';
import { paymentsApi } from '../../../../api/payments';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { Select, Alert } from '../../../../shared/components/ui';

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const subtotal = ensureArray(items).reduce((acc, item) => acc + parseFloat(item.product.price || '0') * item.quantity, 0);
  const navigate = useNavigate();
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [requiresTechnician, setRequiresTechnician] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
  });

  const activeRequests = ensureArray(requests).filter(r => r.status !== 'completed' && r.status !== 'cancelled') || [];

  const orderMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (orderData) => {
      paymentMutation.mutate({ order_id: orderData.id });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create order.');
    }
  });

  const paymentMutation = useMutation({
    mutationFn: paymentsApi.initialize,
    onSuccess: (paymentData) => {
      clearCart();
      // Redirect to Paystack or mock URL
      if (paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
      } else {
        navigate(`/portal/customer/orders/${paymentData.order_id}`, { state: { paymentInitialized: true } });
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to initialize payment.');
    }
  });

  const handleCheckout = () => {
    setError(null);
    
    const payload: { request_id?: string, requires_technician?: boolean, items: any[] } = {
      items: ensureArray(items).map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
    };
    
    if (selectedRequestId) {
      payload.request_id = selectedRequestId;
    } else {
      payload.requires_technician = requiresTechnician;
    }
    
    orderMutation.mutate(payload);
  };

  if (ensureArray(items).length === 0) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <button onClick={() => navigate('/portal/customer/products')} className="text-ess-purple hover:underline">
            Go back to products
          </button>
        </div>
      </PageContainer>
    );
  }

  const isProcessing = orderMutation.isPending || paymentMutation.isPending;

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Checkout</h1>
            <p className="text-gray-500 mt-2">Complete your hardware purchase</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Service Request Attachment (Optional)</h2>
                <p className="text-sm text-gray-600 mb-4">
                  If you are buying hardware for a specific installation, please select the active service request below.
                </p>

                {error && (
                  <Alert type="error" title="Checkout Error" description={error} className="mb-4" />
                )}

                {loadingRequests ? (
                  <Skeleton className="h-12 w-full rounded-lg" />
                ) : ensureArray(activeRequests).length > 0 ? (
                  <Select 
                    value={selectedRequestId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRequestId(e.target.value)}
                    options={[
                      { value: '', label: 'No request (Direct Purchase)' },
                      ...ensureArray(activeRequests).map(req => ({
                      value: req.id,
                      label: `${req.public_id || req.id.split('-')[0]} - ${req.title || req.service_type?.replace('_', ' ')}`
                    }))]}
                  />
                ) : (
                  <Alert 
                    type="info"
                    title="No Active Requests"
                    description="You don't have any active service requests to attach to. This will be processed as a direct product purchase."
                  />
                )}

                {/* Show technician checkbox ONLY if no request is selected (direct purchase) */}
                {!selectedRequestId && (
                  <div className="mt-6 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="requiresTechnician"
                      checked={requiresTechnician}
                      onChange={(e) => setRequiresTechnician(e.target.checked)}
                      className="w-5 h-5 text-ess-purple border-gray-300 rounded focus:ring-ess-purple"
                    />
                    <label htmlFor="requiresTechnician" className="text-sm font-medium text-gray-700">
                      Do you need a technician to help with installation or setup for these items?
                    </label>
                  </div>
                )}
              </section>
            </div>

            <div>
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100 sticky top-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {ensureArray(items).map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <div className="flex gap-4 items-start">
                        <div className="relative">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img src={item.product.images?.[0]?.image || 'https://placehold.co/400x300'} alt={item.product.name} className="w-12 h-12 rounded bg-white object-cover border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">Img</div>
                          )}
                          <span className="absolute -top-2 -right-2 bg-gray-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-gray-500">${(item.product.price || item.product.price)} each</p>
                        </div>
                      </div>
                      <span className="font-medium text-gray-900">${(parseFloat((item.product.price || item.product.price)) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-ess-purple">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full py-4 px-4 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm disabled:opacity-50 relative"
                >
                  {isProcessing ? 'Processing...' : `Pay $${subtotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
