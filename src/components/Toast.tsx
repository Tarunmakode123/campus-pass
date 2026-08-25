import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-in-up transition-all duration-300
      ${type === 'success' 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
        : 'bg-rose-50 border-rose-200 text-rose-800'}
    `}>
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
      )}
      <span className="text-sm font-semibold tracking-wide">{message}</span>
      <button 
        onClick={onClose} 
        className={`p-1 rounded-full hover:bg-black/5 transition-colors`}
      >
        <X className="w-4 h-4 opacity-70" />
      </button>
    </div>
  );
};
