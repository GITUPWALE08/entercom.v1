import type { ReactNode } from 'react';

export function PageContainer({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {title && <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>}
      {children}
    </div>
  );
}
