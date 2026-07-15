import { Filter } from 'lucide-react';

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
      <div className="pl-3 pr-2 flex items-center text-gray-500">
        <Filter className="w-4 h-4 mr-2" />
        <span className="text-sm font-semibold">Filters</span>
      </div>
      <div className="flex-1 flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}
