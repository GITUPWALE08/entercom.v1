import React from 'react';

export type DateRangePeriod = 'today' | '7_days' | '30_days' | '90_days' | 'custom';

interface DashboardFilterProps {
  period: DateRangePeriod;
  onPeriodChange: (period: DateRangePeriod) => void;
}

export function DashboardFilter({
  period,
  onPeriodChange,
}: DashboardFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-1 flex">
        {(['today', '7_days', '30_days', '90_days'] as DateRangePeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              period === p
                ? 'bg-ess-purple text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {p === 'today' ? 'Today' : p === '7_days' ? '7 Days' : p === '30_days' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>
    </div>
  );
}
