import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

import { ChevronDown } from 'lucide-react';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ess-purple/20 focus:border-ess-purple transition-colors cursor-pointer appearance-none ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 hover:border-gray-300'
        } ${className}`}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <ChevronDown size={18} />
      </div>
    </div>
    {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
  </div>
));
Select.displayName = 'Select';
