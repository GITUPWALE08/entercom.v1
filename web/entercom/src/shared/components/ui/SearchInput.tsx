import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function SearchInput({ className = '', ...props }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ess-purple/20 focus:border-ess-purple transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-sm"
        placeholder="Search..."
        {...props}
      />
    </div>
  );
}
