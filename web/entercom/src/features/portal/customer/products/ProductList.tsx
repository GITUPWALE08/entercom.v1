import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productsApi } from '../../../../api/products';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { SearchInput, FilterBar } from '../../../../shared/components/ui';

export default function ProductList() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
  });

  const categories = Array.from(new Set(products?.map(p => p.category).filter(Boolean))) as string[];

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Security Products</h1>
          <p className="mt-2 text-gray-500 text-lg">Premium hardware for your installation.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1">
            <SearchInput 
              placeholder="Search products..." 
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <FilterBar>
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg font-medium text-sm transition-colors ${!selectedCategory ? 'bg-ess-navy text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent'}`}
              >
                All
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-lg font-medium text-sm capitalize transition-colors ${selectedCategory === cat ? 'bg-ess-navy text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent'}`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </FilterBar>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Link 
                to={`/portal/customer/products/${product.id}`} 
                key={product.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0].image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  {product.category && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-semibold text-gray-900 capitalize shadow-sm">
                      {product.category.replace('_', ' ')}
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-ess-purple transition-colors">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-gray-900">${product.price}</span>
                    <span className="text-ess-purple font-medium text-sm group-hover:underline">View</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ShoppingBag className="w-10 h-10" />}
            title="No products found"
            description="There are no products available in the catalog at this time."
            
          />)}
      </PageContainer>
    </ErrorBoundary>
  );
}
