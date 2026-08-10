import React from 'react';
import { Spinner } from './Loading';
import clsx from 'clsx';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  onClick,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/10 focus:ring-primary-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/10 focus:ring-rose-500',
    outline: 'border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-50 cursor-not-allowed active:scale-100',
        className
      )}
      {...props}
    >
      {loading && <Spinner className="w-4 h-4 mr-2" />}
      {!loading && icon && <span className="mr-2 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
