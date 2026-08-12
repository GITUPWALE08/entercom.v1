import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon, title, description, action, secondaryAction, size = 'md' }: EmptyStateProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className={`flex flex-col items-center justify-center text-center rounded-3xl bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md group overflow-hidden relative ${isSm ? 'py-8 px-4' : isLg ? 'py-24 px-8' : 'py-16 px-6'}`}>
      
      {/* Decorative background gradients */}
      {!isSm && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-gradient-to-b from-indigo-50/50 via-purple-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[100%]" />}
      
      {icon && (
        <div className={`relative ${isSm ? 'mb-4' : 'mb-6'}`}>
          {!isSm && <div className="absolute inset-0 bg-indigo-100/50 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />}
          <div className={`relative bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-white shadow-[0_8px_16px_-6px_rgba(79,70,229,0.1)] flex items-center justify-center text-ess-purple transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105 backdrop-blur-sm ${isSm ? 'w-16 h-16 rounded-[1.2rem]' : 'w-24 h-24 rounded-[2rem]'}`}>
            {icon}
          </div>
        </div>
      )}
      
      <h3 className={`font-extrabold text-gray-900 tracking-tight mb-2 transform transition-transform duration-500 group-hover:-translate-y-1 ${isSm ? 'text-lg' : isLg ? 'text-2xl' : 'text-xl'}`}>{title}</h3>
      
      {description && (
        <p className={`text-gray-500 max-w-sm mx-auto leading-relaxed transform transition-transform duration-500 group-hover:-translate-y-1 ${isSm ? 'text-sm' : 'text-base'}`}>
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className={`mt-6 flex flex-col sm:flex-row items-center gap-3 transform transition-transform duration-500 group-hover:-translate-y-1`}>
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
}

export function NoResults({ query }: { query?: string }) {
  return <EmptyState title="No results found" description={query ? `We couldn't find anything matching "${query}".` : "Try adjusting your filters or search term."} />;
}
export function NoRequests() {
  return <EmptyState title="No requests yet" description="You haven't submitted any service requests." />;
}
export function NoOrders() {
  return <EmptyState title="No orders found" description="You don't have any active orders." />;
}
export function NoProducts() {
  return <EmptyState title="No products available" description="There are no products listed matching your criteria." />;
}
