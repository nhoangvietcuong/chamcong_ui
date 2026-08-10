import React from 'react';

export const Spinner = ({ className = 'w-5 h-5', color = 'text-current' }) => (
  <svg
    className={`animate-spin ${className} ${color}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const LoadingOverlay = ({ active }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 dark:bg-black/50 backdrop-blur-[2px] transition-opacity">
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800">
        <Spinner className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Đang xử lý...
        </span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
