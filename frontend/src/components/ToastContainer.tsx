import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-sm shadow-md border flex items-start space-x-3 transition-all duration-300 animate-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-[#FAF9F6] border-[#A6B3A1] text-[#292D29]'
                : isError
                ? 'bg-[#FAF9F6] border-[#E8BDBD] text-[#292D29]'
                : isWarning
                ? 'bg-[#FAF9F6] border-[#ECC9A5] text-[#292D29]'
                : 'bg-[#FAF9F6] border-[#E7E1D7] text-[#292D29]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="h-5 w-5 text-[#294638]" />}
              {isError && <ShieldAlert className="h-5 w-5 text-[#8B3A3A]" />}
              {isWarning && <AlertTriangle className="h-5 w-5 text-[#8A4B1A]" />}
              {!isSuccess && !isError && !isWarning && <Info className="h-5 w-5 text-[#294638]" />}
            </div>

            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs font-serif font-bold text-[#292D29]">
                {toast.title}
              </h4>
              <p className="text-[11px] text-[#5F685F] leading-relaxed font-sans">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 text-[#5F685F] hover:text-[#292D29] transition"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
