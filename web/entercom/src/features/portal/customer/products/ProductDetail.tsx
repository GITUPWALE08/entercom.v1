import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../../../api/products';
import { useCartStore } from '../../../../store/cartStore';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id!),
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="space-y-6"><Skeleton className="h-64 w-full rounded-2xl" /></div>
        </div>
      </PageContainer>
    );
  }

  if (!product) {
    return <PageContainer><div className="text-center py-12">Product not found.</div></PageContainer>;
  }

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-6 flex items-center text-sm text-gray-500">
          <Link to="/portal/customer/products" className="hover:text-ess-purple transition-colors">Products</Link>
          <span className="mx-2">/</span>
          {product.category && (
            <>
              <span className="capitalize">{product.category.replace('_', ' ')}</span>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Image Gallery Area */}
            <div className="bg-gray-50 aspect-square md:aspect-auto md:h-full p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-100">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0].image} alt={product.name} className="w-full max-w-md object-contain mix-blend-multiply" />
              ) : (
                <div className="text-gray-400 font-medium text-lg tracking-widest uppercase">No Image Available</div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-8 sm:p-12 flex flex-col">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{product.name}</h1>
              <div className="text-3xl font-bold text-ess-purple mb-8">${product.price}</div>
              
              <div className="prose prose-sm text-gray-600 mb-10 leading-relaxed flex-1">
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>

              <div className="mt-auto space-y-6 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-4 py-3 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center font-medium text-gray-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => q + 1)}
                      className="px-4 py-3 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 bg-ess-purple text-white py-3 px-6 rounded-lg font-medium hover:bg-ess-darkPurple transition-colors shadow-sm relative overflow-hidden"
                  >
                    {added ? 'Added to Cart ✓' : 'Add to Cart'}
                  </button>
                </div>
                {added && (
                  <p className="text-sm text-green-600 font-medium animate-fade-in-up text-center">
                    Added to your cart successfully! <Link to="/portal/customer/cart" className="underline">View cart</Link>
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
