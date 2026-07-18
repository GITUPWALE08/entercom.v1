import { ensureArray } from '../../../../utils/arrays';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../../../api/products';
import type { ProductItem } from '../../../../api/products';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { DataTable, Input, Select, Pagination } from '../../../../shared/components/ui';

export default function StaffInventory() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  const [selectedForThreshold, setSelectedForThreshold] = useState<ProductItem | null>(null);
  const [thresholdAmount, setThresholdAmount] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
  });

  const adjustMutation = useMutation({
    mutationFn: (payload: { id: string, amount: number, reason: string }) => 
      productsApi.adjust_inventory(payload.id, { adjustment_amount: payload.amount, reason: payload.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProduct(null);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    },
  });

  const thresholdMutation = useMutation({
    mutationFn: (payload: { id: string, threshold: number }) => 
      productsApi.update(payload.id, { low_stock_threshold: payload.threshold }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedForThreshold(null);
      setThresholdAmount('');
    },
  });

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustmentAmount || !adjustmentReason) return;
    adjustMutation.mutate({ 
      id: selectedProduct.id, 
      amount: parseInt(adjustmentAmount, 10), 
      reason: adjustmentReason 
    });
  };

  const handleThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForThreshold || !thresholdAmount) return;
    thresholdMutation.mutate({ 
      id: selectedForThreshold.id, 
      threshold: parseInt(thresholdAmount, 10) 
    });
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return ensureArray(products).filter((prod: ProductItem) => {
      const isLowStock = prod.quantity_available <= (prod.low_stock_threshold || 0);
      if (stockFilter === 'low_stock' && !isLowStock) return false;
      if (stockFilter === 'in_stock' && isLowStock) return false;
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(term);
        const matchesSku = (prod.sku || '').toLowerCase().includes(term);
        if (!matchesName && !matchesSku) return false;
      }
      return true;
    });
  }, [products, searchTerm, stockFilter]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(ensureArray(filteredProducts).length / itemsPerPage);

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
            <p className="mt-2 text-gray-500 text-lg">Monitor stock levels and record adjustments.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input 
            placeholder="Search by Product Name or SKU..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="flex-1"
          />
          <Select 
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }}
            options={[
              {label: 'All Items', value: 'all'},
              {label: 'Low Stock Only', value: 'low_stock'},
              {label: 'In Stock Only', value: 'in_stock'}
            ]}
            className="w-full sm:w-48"
          />
        </div>

        {/* Inventory Table */}
        <div className="mb-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : (
            <>
              <DataTable 
                data={paginatedProducts}
                keyExtractor={(prod) => prod.id}
                emptyTitle="No inventory items found"
                emptyDescription="Adjust your search or filters to see results."
                columns={[
                  {
                    header: 'Product / SKU',
                    accessor: (prod) => (
                      <div>
                        <p className="font-semibold text-gray-900">{prod.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">{prod.sku || 'NO-SKU'}</p>
                      </div>
                    )
                  },
                  {
                    header: 'Available Qty',
                    className: 'text-center',
                    accessor: (prod) => {
                      const isLowStock = prod.quantity_available <= (prod.low_stock_threshold || 0);
                      return (
                        <span className={`font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {prod.quantity_available}
                        </span>
                      );
                    }
                  },
                  {
                    header: 'Threshold',
                    className: 'text-center',
                    accessor: (prod) => (
                      <span className="text-gray-600 font-medium">{prod.low_stock_threshold || 0}</span>
                    )
                  },
                  {
                    header: 'Status',
                    className: 'text-center',
                    accessor: (prod) => {
                      const isLowStock = prod.quantity_available <= (prod.low_stock_threshold || 0);
                      return isLowStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Low Stock</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                      );
                    }
                  },
                  {
                    header: 'Actions',
                    className: 'text-right',
                    accessor: (prod) => (
                      <div>
                        <button 
                          onClick={() => setSelectedForThreshold(prod)}
                          className="text-ess-purple hover:underline text-sm font-medium mr-4"
                        >
                          Set Threshold
                        </button>
                        <button 
                          onClick={() => setSelectedProduct(prod)}
                          className="text-ess-purple hover:underline text-sm font-medium"
                        >
                          Adjust Qty
                        </button>
                      </div>
                    )
                  }
                ]}
              />
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Adjust Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Adjust Inventory</h2>
              <p className="text-gray-500 text-sm mb-6">Updating stock for <strong className="text-gray-900">{selectedProduct.name}</strong></p>
              
              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <Input 
                    label="Adjustment Amount (+ or -)"
                    type="number"
                    value={adjustmentAmount}
                    onChange={e => setAdjustmentAmount(e.target.value)}
                    placeholder="e.g. 5, -2"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Current quantity: {selectedProduct.quantity_available}</p>
                </div>
                <div>
                  <Select 
                    label="Reason code"
                    value={adjustmentReason}
                    onChange={e => setAdjustmentReason(e.target.value)}
                    options={[
                      { label: "Restock", value: "restock" },
                      { label: "Damaged", value: "damage" },
                      { label: "Loss/Shrinkage", value: "loss" },
                      { label: "Correction", value: "correction" }
                    ]}
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button"
                    onClick={() => { setSelectedProduct(null); setAdjustmentAmount(''); setAdjustmentReason(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={adjustMutation.isPending || !adjustmentAmount || !adjustmentReason}
                    className="px-4 py-2 bg-ess-purple text-white rounded-xl hover:bg-ess-darkPurple transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {adjustMutation.isPending ? 'Saving...' : 'Apply Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Threshold Modal */}
        {selectedForThreshold && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Set Low Stock Threshold</h2>
              <p className="text-gray-500 text-sm mb-6">Updating threshold for <strong className="text-gray-900">{selectedForThreshold.name}</strong></p>
              
              <form onSubmit={handleThreshold} className="space-y-4">
                <div>
                  <Input 
                    label="Alert when stock falls below:"
                    type="number"
                    min="0"
                    value={thresholdAmount}
                    onChange={e => setThresholdAmount(e.target.value)}
                    placeholder="e.g. 10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Current threshold: {selectedForThreshold.low_stock_threshold || 0}</p>
                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    type="button"
                    onClick={() => { setSelectedForThreshold(null); setThresholdAmount(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={thresholdMutation.isPending || !thresholdAmount}
                    className="px-4 py-2 bg-ess-purple text-white rounded-xl hover:bg-ess-darkPurple transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {thresholdMutation.isPending ? 'Saving...' : 'Update Threshold'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </ErrorBoundary>
  );
}
