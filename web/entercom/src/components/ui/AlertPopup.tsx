// import React from 'react';
import { useAlertStore } from '../../store/alertStore';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export function AlertPopup() {
  const { isOpen, type, title, message, buttons, hideAlert } = useAlertStore();

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'cancel':
        return <AlertCircle className="w-8 h-8 text-orange-500" />;
      default:
        return <Info className="w-8 h-8 text-gray-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'pending': return 'bg-blue-50 border-blue-200';
      case 'cancel': return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const handleClose = () => {
    hideAlert();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-2xl shadow-xl border p-6 ${getBgColor()} transform animate-in zoom-in-95 duration-200`}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{getIcon()}</div>
          
          {title && <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>}
          <p className="text-sm text-gray-600 mb-6">{message}</p>
          
          <div className="flex flex-col w-full gap-2 mt-2">
            {buttons && buttons.length > 0 ? (
              buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (btn.onPress) btn.onPress();
                    handleClose();
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium transition-colors ${
                    btn.style === 'destructive' 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : btn.style === 'cancel'
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  {btn.text}
                </button>
              ))
            ) : (
              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
              >
                Okay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
