import React from 'react';
import clsx from 'clsx';

export const Skeleton = ({ className }) => (
  <div className={clsx("animate-pulse bg-slate-200 dark:bg-slate-800 rounded", className)} />
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-6 flex-1" />
      ))}
    </div>
    <div className="p-4 flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export default Skeleton;
