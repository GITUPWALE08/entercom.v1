import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { requestsApi } from '../../../api/requests';
import { ordersApi } from '../../../api/orders';
import { productsApi } from '../../../api/products';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { Card, CardContent, StatusBadge } from '../../../shared/components/ui';
import { Skeleton as SkeletonFallback } from '../../../shared/components/Skeleton';

export default function CustomerDashboard() {
  const { user } = useAuthStore();

  const { data: requests, isLoading: loadingReqs } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.list,
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
  });

  const activeRequest = requests?.find(r => r.status !== 'completed' && r.status !== 'cancelled');
  const recentOrder = orders?.[0];
  const recommendedProducts = products?.slice(0, 3) || [];

  return (
    <ErrorBoundary>
      <PageContainer>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.first_name || 'Customer'}
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Here's what's happening with your security systems.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Activity Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Request / Quick Action */}
            <Card>
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Continue where you left off</h2>
                
                {loadingReqs ? (
                  <div className="space-y-4">
                    <SkeletonFallback className="h-20 w-full" />
                  </div>
                ) : activeRequest ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div>
                      <StatusBadge status={activeRequest.status} />
                      <h3 className="text-lg font-medium text-gray-900 mt-2">{activeRequest.title || 'Service Request'}</h3>
                      <p className="text-sm text-gray-600 mt-1">We are reviewing your request details.</p>
                    </div>
                    <Link to={`/portal/customer/requests/${activeRequest.id}`} className="px-4 py-2 bg-ess-purple text-white rounded-lg text-sm font-medium hover:bg-ess-darkPurple transition-colors">
                      View Status
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-ess-purple">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Need a new installation or service?</h3>
                    <p className="mt-1 text-sm text-gray-500 mb-4">Start a new service request and get a quote within 24 hours.</p>
                    <Link to="/portal/customer/requests/new" className="text-ess-purple font-medium hover:text-ess-darkPurple transition-colors">
                      Create Request &rarr;
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Installations & Orders</h2>
              {loadingOrders ? (
                <SkeletonFallback className="h-32 w-full" />
              ) : recentOrder ? (
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order #{recentOrder.id.split('-')[0]}</p>
                    <p className="font-medium text-gray-900">Total: ${recentOrder.total_amount}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={recentOrder.status} />
                    <Link to={`/portal/customer/orders/${recentOrder.id}`} className="block text-sm text-ess-purple hover:underline mt-2">
                      View Details
                    </Link>
                  </div>
                </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-50 text-center">
                  <CardContent>
                    <p className="text-gray-500 text-sm">You have no recent orders.</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardContent>
                <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/portal/customer/requests/new" className="block w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-ess-purple hover:bg-purple-50 transition-colors group">
                  <p className="font-medium text-gray-900 group-hover:text-ess-purple">Request Service</p>
                  <p className="text-xs text-gray-500">Book a technician or get a quote</p>
                </Link>
                <Link to="/portal/customer/products" className="block w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-ess-purple hover:bg-purple-50 transition-colors group">
                  <p className="font-medium text-gray-900 group-hover:text-ess-purple">Browse Catalogue</p>
                  <p className="text-xs text-gray-500">Shop premium security products</p>
                </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Products */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Recommended for You</h2>
              {loadingProducts ? (
                 <div className="space-y-4"><SkeletonFallback className="h-20 w-full" /><SkeletonFallback className="h-20 w-full" /></div>
              ) : recommendedProducts.length > 0 ? (
                <div className="space-y-4">
                  {recommendedProducts.map(product => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center space-x-4 p-4">
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0].image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm font-bold text-ess-purple mt-1">${product.price}</p>
                      </div>
                    </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recommendations right now.</p>
              )}
            </section>
          </div>

        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
