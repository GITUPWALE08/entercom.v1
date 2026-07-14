import os

base_dir = r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\web\entercom\src\shared\components\ui"
os.makedirs(base_dir, exist_ok=True)

components = {
    # LOADING
    "Spinner.tsx": """import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={`animate-spin rounded-full border-gray-200 border-t-ess-purple ${sizeClasses[size]} ${className}`} />
  );
}
""",

    "LoadingOverlay.tsx": """import React from 'react';
import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-inherit">
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-semibold text-gray-700 animate-pulse">{message}</p>
    </div>
  );
}
""",

    # DATA DISPLAY
    "Card.tsx": """import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 border-b border-gray-100 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function MetricCard({ title, value, icon, trend }: { title: string; value: string | number; icon?: React.ReactNode; trend?: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-2">{trend}</p>}
        </div>
        {icon && (
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-ess-purple flex items-center justify-center">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
""",

    "StatusBadge.tsx": """import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'approved':
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)} uppercase tracking-wider`}>
      {status.replace('_', ' ')}
    </span>
  );
}
""",

    "DataTable.tsx": """import React from 'react';
import { EmptyState } from '../EmptyState';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({ data, columns, keyExtractor, emptyTitle = 'No data found', emptyDescription = '' }: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-6 py-4 font-semibold ${col.className || ''}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-gray-50/50 transition-colors">
              {columns.map((col, idx) => (
                <td key={idx} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                  {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
""",

    "Timeline.tsx": """import React from 'react';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  status?: string;
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
      {events.map((event) => (
        <div key={event.id} className="relative pl-6">
          <div className="absolute w-4 h-4 bg-ess-purple rounded-full -left-[9px] top-1 border-4 border-white shadow-sm" />
          <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
          <p className="text-xs text-gray-500 mt-1">{new Date(event.date).toLocaleString()}</p>
          {event.description && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">{event.description}</p>}
        </div>
      ))}
    </div>
  );
}
""",

    # FORMS
    "Input.tsx": """import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ess-purple/20 focus:border-ess-purple transition-colors ${
        error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
      } ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
  </div>
));
Input.displayName = 'Input';
""",

    "TextArea.tsx": """import React, { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
    <textarea
      ref={ref}
      className={`w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ess-purple/20 focus:border-ess-purple transition-colors min-h-[120px] resize-y ${
        error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
      } ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
  </div>
));
TextArea.displayName = 'TextArea';
""",

    "Select.tsx": """import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
    <select
      ref={ref}
      className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ess-purple/20 focus:border-ess-purple transition-colors appearance-none ${
        error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
      } ${className}`}
      {...props}
    >
      <option value="" disabled>Select an option</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
  </div>
));
Select.displayName = 'Select';
""",

    "FormSection.tsx": """import React from 'react';

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {children}
      </div>
    </div>
  );
}
""",

    # SEARCH & FILTERS & PAGINATION
    "SearchInput.tsx": """import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function SearchInput({ className = '', ...props }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-ess-purple/20 focus:border-ess-purple transition-colors text-sm"
        placeholder="Search..."
        {...props}
      />
    </div>
  );
}
""",

    "FilterBar.tsx": """import React from 'react';
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
""",

    "Pagination.tsx": """import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600 font-medium px-4">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
""",

    # FEEDBACK / TOASTS (using Zustand since no react-hot-toast)
    "ToastContainer.tsx": """import React from 'react';
import { useToastStore } from './toastStore';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border max-w-sm transform transition-all animate-fade-in-up ${
            toast.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
            toast.type === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' :
            'bg-white border-gray-100 text-gray-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
          
          <div className="flex-1 text-sm font-medium leading-5">
            {toast.message}
          </div>
          
          <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
""",

    "toastStore.ts": """import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
  error: (msg: string) => useToastStore.getState().addToast(msg, 'error'),
  info: (msg: string) => useToastStore.getState().addToast(msg, 'info'),
  warning: (msg: string) => useToastStore.getState().addToast(msg, 'warning'),
};
""",

    "Alert.tsx": """import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  className?: string;
}

export function Alert({ title, description, type = 'info', className = '' }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-100',
    success: 'bg-green-50 text-green-800 border-green-100',
    error: 'bg-red-50 text-red-800 border-red-100',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-100',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  };

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${styles[type]} ${className}`}>
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div>
        <h5 className="font-bold text-sm">{title}</h5>
        {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
      </div>
    </div>
  );
}
""",
    
    "ConfirmationDialog.tsx": """import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmationDialog({
  isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, isDestructive = false
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform animate-scale-in">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 font-semibold text-white rounded-lg transition-colors ${
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-ess-purple hover:bg-ess-darkPurple'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
"""
}

# Also update EmptyState variants
empty_state_variants = """
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
"""

with open(r"C:\\Users\\HP\\Desktop\\workspace\\entercom\\v1\\entercom\\web\\entercom\\src\\shared\\components\\EmptyState.tsx", "a") as f:
    f.write(empty_state_variants)

# Write all new components
for name, content in components.items():
    path = os.path.join(base_dir, name)
    with open(path, "w") as f:
        f.write(content)

print("Generated UI components successfully.")
