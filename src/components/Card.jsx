import React from 'react';
import clsx from 'clsx';

export const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm p-6 overflow-hidden transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
