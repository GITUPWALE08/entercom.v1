import { useState, useMemo } from 'react';
import { Tags } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productsApi } from '../../../../api/products';
import type { ProductItem } from '../../../../api/products';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Input, Select, Pagination } from '../../../../shared/components/ui';

export default function StaffProductList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Grid items

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
  });

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];
    
    let result = products.filter((prod: ProductItem) => {
      if (statusFilter !== 'all' && prod.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(term);
        const matchesSku = (prod.sku || '').toLowerCase().includes(term);
        if (!matchesName && !matchesSku) return false;
      }
      return true;
    });

    result.sort((a: ProductItem, b: ProductItem) => {
      if (sortOrder === 'name_asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name_desc') return b.name.localeCompare(a.name);
      if (sortOrder === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sortOrder === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
      return 0;
    });

    return result;
  }, [products, searchTerm, statusFilter, sortOrder]);

  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Products</h1>
            <p className="mt-2 text-gray-500 text-lg">Manage product catalog and basic details.</p>
          </div>
          <Link 
            to="/portal/staff/products/new"
            className="px-6 py-3 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm"
          >
            Add New Product
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input 
            placeholder="Search by Name or SKU..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="flex-1"
          />
          <Select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            options={[
              {label: 'All Statuses', value: 'all'},
              {label: 'Active', value: 'active'},
              {label: 'Inactive', value: 'inactive'}
            ]}
            className="w-full sm:w-48"
          />
          <Select 
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
            options={[
              {label: 'Name (A-Z)', value: 'name_asc'},
              {label: 'Name (Z-A)', value: 'name_desc'},
              {label: 'Price (Low to High)', value: 'price_asc'},
              {label: 'Price (High to Low)', value: 'price_desc'}
            ]}
            className="w-full sm:w-48"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product: ProductItem) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
                  <div className="h-48 bg-gray-100 flex items-center justify-center border-b border-gray-100">
                    <span className="text-gray-400 font-medium">No Image</span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-ess-purple transition-colors">{product.name}</h3>
                      <span className="font-bold text-gray-900">${parseFloat(product.price).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500 font-mono mb-2">SKU: {product.sku || 'N/A'}</p>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description || 'No description available.'}</p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                        ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {product.status}
                      </span>
                      <Link 
                        to={`/portal/staff/products/${product.id}`}
                        className="text-sm font-medium text-ess-purple hover:underline"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
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
            icon={<Tags className="w-10 h-10" />}
            title="No products found"
            description="Adjust your filters or add a new product to see results."
            action={
              <Link 
                to="/portal/staff/products/new" 
                className="inline-flex justify-center items-center px-6 py-2.5 bg-ess-purple text-white text-sm font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm"
              >
                Create Product
              </Link>
            }
          />)}
      </PageContainer>
    </ErrorBoundary>
  );
}
