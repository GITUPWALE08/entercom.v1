import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '../../../../api/requests';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { TextArea } from '../../../../shared/components/ui';

export default function QuoteDetail() {
  const { requestId, quoteId } = useParams<{ requestId: string, quoteId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [revisionReason, setRevisionReason] = useState('');
  const [showReviseInput, setShowReviseInput] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: request, isLoading: loadingReq } = useQuery({
    queryKey: ['requests', requestId],
    queryFn: () => requestsApi.get(requestId!),
    enabled: !!requestId,
  });

  const { data: quotes, isLoading: loadingQuotes } = useQuery({
    queryKey: ['requests', requestId, 'quotes'],
    queryFn: () => requestsApi.quotes.list(requestId!),
    enabled: !!requestId,
  });

  const quote = quotes?.find((q: any) => q.id === quoteId);

  const actionMutation = useMutation({
    mutationFn: ({ action, reason }: { action: 'approve'|'reject'|'revise', reason?: string }) => 
      requestsApi.quotes.action(requestId!, action, reason),
    onMutate: async ({ action }) => {
      await queryClient.cancelQueries({ queryKey: ['requests', requestId, 'quotes'] });
      const previousQuotes = queryClient.getQueryData(['requests', requestId, 'quotes']);
      
      queryClient.setQueryData(['requests', requestId, 'quotes'], (old: any) => {
        if (!old) return old;
        return old.map((q: any) => {
          if (q.id === quoteId) {
            let newStatus = q.status;
            if (action === 'approve') newStatus = 'approved';
            else if (action === 'reject') newStatus = 'rejected';
            else if (action === 'revise') newStatus = 'needs_revision';
            return { ...q, status: newStatus };
          }
          return q;
        });
      });
      return { previousQuotes };
    },
    onError: (_err, _newTodo, context) => {
      queryClient.setQueryData(['requests', requestId, 'quotes'], context?.previousQuotes);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests', requestId, 'quotes'] });
      
      if (variables.action === 'approve') {
        setShowSuccessModal(true);
      } else {
        if (!showReviseInput) navigate(`/portal/customer/requests/${requestId}`);
        setShowReviseInput(false);
      }
    }
  });

  if (loadingReq || loadingQuotes) {
    return <PageContainer><Skeleton className="h-96 w-full rounded-2xl" /></PageContainer>;
  }

  if (!quote) {
    return <PageContainer><div className="text-center py-12">Proposal not found.</div></PageContainer>;
  }

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center text-sm text-gray-500">
            <Link to={`/portal/customer/requests/${requestId}`} className="hover:text-ess-purple transition-colors">
              &larr; Back to Request
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-ess-navy text-white p-8 sm:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="uppercase tracking-widest text-xs font-semibold text-purple-300 mb-4">Investment Proposal</div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{request?.title || 'Security System Installation'}</h1>
                <p className="text-gray-300 max-w-xl text-lg">
                  Thank you for trusting Entercom. Below is the detailed breakdown of the proposed solution for your property.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Scope of Work</h2>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {quote.notes || 'As discussed, this covers all required hardware, licensing, and professional installation services to fully secure your premises according to the requested specifications.'}
                    </p>
                  </section>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6 h-fit border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Investment Summary</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Hardware & Licensing</span>
                      <span className="font-medium">Included</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Labor & Installation</span>
                      <span className="font-medium">Included</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-end">
                        <span className="text-gray-900 font-bold">Total Investment</span>
                        <span className="text-3xl font-bold text-ess-purple">${parseFloat(quote.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">Taxes included</p>
                    </div>
                  </div>

                  {quote.status === 'issued' && (
                    <div className="space-y-3 mt-8">
                      <button 
                        onClick={() => actionMutation.mutate({ action: 'approve' })}
                        disabled={actionMutation.isPending}
                        className="w-full py-3 px-4 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm disabled:opacity-50"
                      >
                        {actionMutation.isPending ? 'Processing...' : 'Approve Proposal'}
                      </button>
                      <button 
                        onClick={() => setShowReviseInput(!showReviseInput)}
                        disabled={actionMutation.isPending}
                        className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Request Revision
                      </button>
                    </div>
                  )}

                  {quote.status !== 'issued' && (
                    <div className="mt-8 text-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className={`text-sm font-medium capitalize ${quote.status === 'approved' ? 'text-green-600' : 'text-gray-500'}`}>
                        Status: {quote.status.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Revision Input Area */}
              {showReviseInput && quote.status === 'issued' && (
                <div className="mt-8 bg-purple-50 p-6 rounded-2xl border border-purple-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">What would you like us to change?</h3>
                  <TextArea 
                    value={revisionReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRevisionReason(e.target.value)}
                    rows={3}
                    placeholder="E.g. Can we remove the second camera to lower the cost?"
                  />
                  <div className="flex gap-3 justify-end mt-4">
                    <button 
                      onClick={() => setShowReviseInput(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => actionMutation.mutate({ action: 'revise', reason: revisionReason })}
                      disabled={!revisionReason.trim() || actionMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-ess-purple rounded-xl hover:bg-ess-darkPurple disabled:opacity-50"
                    >
                      Submit Revision Request
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </PageContainer>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 sm:p-10 text-center animate-fade-in-up border border-gray-100">
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Proposal Approved!</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Thank you for choosing Entercom. The next step is to secure your order through checkout.
            </p>
            
            <div className="flex flex-col gap-3">
              <Link 
                to={`/portal/customer/requests/${requestId}`}
                className="w-full py-3 px-4 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm"
              >
                Continue to Payment
              </Link>
              <Link 
                to="/portal/customer/requests"
                className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Return to Requests
              </Link>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
