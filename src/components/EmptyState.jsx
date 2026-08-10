import React from 'react';
import { FiInbox } from 'react-icons/fi';
import Button from './Button';

export const EmptyState = ({
  title = 'Không có dữ liệu',
  description = 'Không tìm thấy kết quả nào phù hợp.',
  icon = <FiInbox className="w-12 h-12 text-slate-400 dark:text-slate-650" />,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/10">
      <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900/50">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
