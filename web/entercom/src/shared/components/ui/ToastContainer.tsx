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
