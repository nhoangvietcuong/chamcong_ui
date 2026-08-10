import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(({
  label,
  name,
  type = 'text',
  error,
  icon,
  className,
  containerClassName,
  ...props
}, ref) => {
  return (
    <div className={clsx("flex flex-col gap-1.5 w-full text-left", containerClassName)}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          className={clsx(
            "w-full rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100",
            "placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm py-2.5 transition-all duration-200",
            "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10",
            icon ? "pl-11 pr-4" : "px-4",
            error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : "border-slate-200 dark:border-slate-850",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-rose-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
