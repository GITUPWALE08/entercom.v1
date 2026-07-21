import { ensureArray } from '../../../../utils/arrays';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../../../store/cartStore';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ShoppingCart } from 'lucide-react';

export default function Cart() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const subtotal = ensureArray(items).reduce((acc, item) => acc + parseFloat(item.product.price || '0') * item.quantity, 0);
  const navigate = useNavigate();

  if (ensureArray(items).length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={<ShoppingCart className="w-10 h-10" />}
          title="Your cart is empty"
          description="Looks like you haven't added any products to your cart yet."
          action={
            <Link 
              to="/portal/customer/products" 
              className="inline-flex justify-center items-center px-6 py-2.5 bg-ess-purple text-white text-sm font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm"
            >
              Browse Shop
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shopping Cart</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {ensureArray(items).map((item) => (
            <div key={item.product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-32 h-32 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden">
                {item.product.images && item.product.images.length > 0 ? (
                  <img src={item.product.images?.[0]?.image || 'https://placehold.co/400x300'} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingCart className="w-8 h-8 text-gray-300" />
                )}
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/portal/customer/products/${item.product.id}`} className="font-semibold text-gray-900 hover:text-ess-purple transition-colors text-lg">
                    {item.product.name}
                  </Link>
                  <span className="font-bold text-gray-900 whitespace-nowrap ml-4">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                </div>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.product.description}</p>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.product.id)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="font-medium text-gray-900">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-ess-purple">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/portal/customer/checkout')}
              className="w-full py-3.5 px-4 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
