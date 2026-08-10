import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import clsx from 'clsx';

export const Table = ({
  headers = [],
  items = [],
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  renderRow,
  emptyState,
  pagination,
}) => {
  const handleHeaderClick = (h) => {
    if (!h.sortable || !onSort) return;
    const newOrder = sortBy === h.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(h.key, newOrder);
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={headers.length} />;
  }

  if (!items || items.length === 0) {
    return emptyState || <EmptyState />;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200/50 dark:border-slate-850 sticky top-0 backdrop-blur-[4px]">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => handleHeaderClick(h)}
                  className={clsx(
                    "px-6 py-3.5 font-semibold select-none",
                    h.sortable && "cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  )}
                  style={{ width: h.width }}
                >
                  <div className="flex items-center gap-0.5">
                    {h.label}
                    {h.sortable && sortBy === h.key && (
                      sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3 text-primary-500" /> : <FiArrowDown className="w-3 h-3 text-primary-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
            {items.map((item, rowIndex) => (
              <tr
                key={item.id || item.employee_id || item.department_id || item.location_id || item.assignment_id || item.attendance_id || rowIndex}
                className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors duration-150"
              >
                {renderRow ? renderRow(item, rowIndex) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination}
    </div>
  );
};

export default Table;
