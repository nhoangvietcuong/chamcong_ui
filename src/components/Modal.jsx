import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import clsx from 'clsx';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Modal Container */}
      <div
        className={clsx(
          "relative bg-white dark:bg-slate-900 w-full rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800",
          "animate-fade-in transition-all duration-300 max-h-[90vh] flex flex-col",
          sizes[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-450 hover:text-slate-750 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
