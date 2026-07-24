import { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
    <textarea
      ref={ref}
      className={`w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ess-purple/20 focus:border-ess-purple transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed resize-y min-h-[100px] ${
        error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
  </div>
));
TextArea.displayName = 'TextArea';
