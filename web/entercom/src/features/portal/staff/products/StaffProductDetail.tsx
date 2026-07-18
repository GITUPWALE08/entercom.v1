import { ensureArray } from '../../../../utils/arrays';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../../../api/products';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Input, Select, TextArea } from '../../../../shared/components/ui';

export default function StaffProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sku: '',
    category: '',
    description: '',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.categories.list,
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (product && !isNew) {
      setFormData({
        name: product.name,
        price: product.price,
        sku: product.sku || '',
        category: product.category || '',
        description: product.description || '',
      });
    }
  }, [product, isNew]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) => isNew ? productsApi.create(payload) : productsApi.update(id!, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (isNew) {
        navigate(`/portal/staff/products/${data.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['products', id] });
      }
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => productsApi.archive(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/portal/staff/products');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
    });
  };

  if (isLoading) {
    return <PageContainer><Skeleton className="h-96 w-full rounded-2xl" /></PageContainer>;
  }

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-6 flex items-center justify-between text-sm">
          <Link to="/portal/staff/products" className="text-gray-500 hover:text-ess-purple transition-colors">
            &larr; Back to Products
          </Link>
          {!isNew && product && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
              ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {product.status}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
                {isNew ? 'Create Product' : 'Edit Product'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Product Name"
                    type="text" 
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input 
                    label="SKU"
                    type="text" 
                    value={formData.sku}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Unit Price ($)"
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                  <Select
                    label="Category"
                    value={formData.category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category: e.target.value })}
                    options={[{ value: '', label: 'Select a category' }, ...(ensureArray(categories).map((c: any) => ({ value: c.id, label: c.name })) || [])]}
                    required
                  />
                </div>

                <TextArea 
                  label="Description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  {!isNew && (
                    <button 
                      type="button"
                      onClick={() => archiveMutation.mutate()}
                      className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors mr-auto"
                    >
                      Archive Product
                    </button>
                  )}
                  <Link 
                    to="/portal/staff/products"
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button 
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="px-6 py-2.5 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {!isNew && product && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Inventory Status</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Available Quantity</span>
                    <span className="text-2xl font-bold text-gray-900">{product.quantity_available}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    To adjust inventory levels or update low stock thresholds, please use the dedicated Inventory Management tools.
                  </p>
                  <Link 
                    to="/portal/staff/inventory"
                    className="block w-full py-2.5 px-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors text-center"
                  >
                    Go to Inventory Controls
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
