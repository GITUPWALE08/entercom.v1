import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ess-purple/20 focus:border-ess-purple transition-colors appearance-none pr-10 ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
        } ${className}`}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
  </div>
));
Select.displayName = 'Select';
