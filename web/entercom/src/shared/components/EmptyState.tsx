import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-gray-100 shadow-sm animate-fade-in-up">
      {icon && (
        <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100/50 flex items-center justify-center text-ess-purple shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-base text-gray-500 max-w-md">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
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
