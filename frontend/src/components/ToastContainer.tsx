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
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-lg border flex items-start space-x-3 transition-all duration-300 animate-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-white border-emerald-200 text-clinical-text'
                : isError
                ? 'bg-white border-rose-200 text-clinical-text'
                : isWarning
                ? 'bg-white border-amber-200 text-clinical-text'
                : 'bg-white border-sage-200 text-clinical-text'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {isError && <ShieldAlert className="h-5 w-5 text-rose-600" />}
              {isWarning && <AlertTriangle className="h-5 w-5 text-amber-600" />}
              {!isSuccess && !isError && !isWarning && <Info className="h-5 w-5 text-sage-700" />}
            </div>

            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs font-semibold font-serif text-clinical-text">
                {toast.title}
              </h4>
              <p className="text-[11px] text-clinical-muted leading-relaxed font-sans">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 rounded-lg text-clinical-muted hover:text-clinical-text transition"
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
