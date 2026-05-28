import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ToastProps {
  key?: React.Key;
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" id={`toast-success-icon-${toast.id}`} />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" id={`toast-error-icon-${toast.id}`} />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" id={`toast-info-icon-${toast.id}`} />,
  };

  const bgColors = {
    success: 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/50 shadow-[0_8px_30px_rgb(16,185,129,0.08)]',
    error: 'bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/50 shadow-[0_8px_30px_rgb(244,63,94,0.08)]',
    info: 'bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/50 shadow-[0_8px_30px_rgb(59,130,246,0.08)]',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${bgColors[toast.type]} max-w-sm w-full dark:text-slate-100 relative pointer-events-auto`}
      id={`toast-message-${toast.id}`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm font-medium pr-6 leading-tight select-none">
        {toast.message}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="absolute top-3.5 right-3 h-5 w-5 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="Close toast"
        id={`toast-close-btn-${toast.id}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      id="toast-notifications-container"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}
