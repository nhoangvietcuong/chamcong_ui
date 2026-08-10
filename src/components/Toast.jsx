import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo, FiX } from 'react-icons/fi';
import useApp from '../hooks/useApp';
import clsx from 'clsx';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const { message, type } = toast;

  const iconMap = {
    success: <FiCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <FiAlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <FiXCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <FiInfo className="w-5 h-5 text-accent-blue shrink-0" />,
  };

  const bgMap = {
    success: 'border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/20 dark:border-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    warning: 'border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/20 dark:border-amber-500/10 text-amber-800 dark:text-amber-200',
    error: 'border-rose-500/20 bg-rose-50/90 dark:bg-rose-950/20 dark:border-rose-500/10 text-rose-800 dark:text-rose-200',
    info: 'border-sky-500/20 bg-sky-50/90 dark:bg-sky-950/20 dark:border-sky-500/10 text-sky-800 dark:text-sky-200',
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md pointer-events-auto",
        "animate-fade-in transition-all duration-300",
        bgMap[type] || bgMap.info
      )}
    >
      {iconMap[type] || iconMap.info}
      <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastContainer;
