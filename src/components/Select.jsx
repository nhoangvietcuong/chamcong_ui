import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Select = forwardRef(({
  label,
  name,
  options = [],
  error,
  icon,
  className,
  containerClassName,
  placeholder,
  children,
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
        <select
          ref={ref}
          id={name}
          name={name}
          className={clsx(
            "w-full rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100",
            "text-sm py-2.5 transition-all duration-200 cursor-pointer appearance-none pr-10",
            "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10",
            icon ? "pl-11" : "px-4",
            error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : "border-slate-200 dark:border-slate-850",
            className
          )}
          {...props}
        >
          {children ? children : (
            <>
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </>
          )}
        </select>
        <span className="absolute right-3.5 text-[10px] text-slate-400 pointer-events-none">
          ▼
        </span>
      </div>
      {error && (
        <span className="text-xs text-rose-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
