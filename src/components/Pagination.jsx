import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import clsx from 'clsx';

export const Pagination = ({ page, limit, total, onPageChange }) => {
  const totalPages = Math.ceil(total / limit) || 1;

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 1; // Pages to show before/after current page
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/10">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Hiển thị <span className="font-semibold text-slate-850 dark:text-slate-200">{Math.min((page - 1) * limit + 1, total)}</span> đến{' '}
        <span className="font-semibold text-slate-850 dark:text-slate-200">{Math.min(page * limit, total)}</span> trong{' '}
        <span className="font-semibold text-slate-850 dark:text-slate-200">{total}</span> bản ghi
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-400 transition-colors"
        >
          <FiChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-400 transition-colors"
        >
          <FiChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-slate-400">
                ...
              </span>
            );
          }

          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150",
                p === page
                  ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                  : "border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-400 transition-colors"
        >
          <FiChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-400 transition-colors"
        >
          <FiChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
