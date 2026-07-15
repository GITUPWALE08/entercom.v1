import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  title: string;
  description?: React.ReactNode;
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
