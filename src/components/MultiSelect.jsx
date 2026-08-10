import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FiChevronDown, FiX } from 'react-icons/fi';

export const MultiSelect = ({
  label,
  options = [],
  value = [],
  onChange,
  error,
  placeholder = 'Chọn...',
  containerClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleOption = (optionValue) => {
    const numericValue = typeof optionValue === 'number' ? optionValue : Number(optionValue);
    const isChecked = value.includes(numericValue) || value.includes(String(numericValue));
    let newValue;
    if (isChecked) {
      newValue = value.filter(val => Number(val) !== numericValue);
    } else {
      newValue = [...value, numericValue];
    }
    onChange(newValue);
  };

  const handleRemoveOption = (event, optionValue) => {
    event.stopPropagation();
    const numericValue = typeof optionValue === 'number' ? optionValue : Number(optionValue);
    const newValue = value.filter(val => Number(val) !== numericValue);
    onChange(newValue);
  };

  const selectedOptions = options.filter(opt => {
    const optVal = typeof opt.value === 'number' ? opt.value : Number(opt.value);
    return value.map(Number).includes(optVal);
  });

  const unselectedOptions = options.filter(opt => {
    const optVal = typeof opt.value === 'number' ? opt.value : Number(opt.value);
    return !value.map(Number).includes(optVal);
  });

  return (
    <div className={clsx("flex flex-col gap-1.5 w-full text-left", containerClassName)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "min-h-[42px] w-full rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100",
            "text-sm py-2 px-3 transition-all duration-200 cursor-pointer flex flex-wrap items-center gap-1.5 pr-10",
            "focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10",
            error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : "border-slate-200 dark:border-slate-850"
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-slate-800 dark:text-slate-100">{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 bg-primary-50 dark:bg-primary-950/30 text-primary-750 dark:text-primary-300 px-2 py-0.5 rounded-lg text-xs font-semibold border border-primary-100/40 dark:border-primary-900/30"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => handleRemoveOption(e, opt.value)}
                  className="hover:text-primary-900 dark:hover:text-white transition-colors"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
          <span
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200"
            style={{ transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}
          >
            <FiChevronDown className="w-4 h-4" />
          </span>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg dark:shadow-2xl max-h-60 overflow-y-auto p-1.5 space-y-0.5 animate-fadeIn">
            {unselectedOptions.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-3 text-center">Không có tùy chọn</div>
            ) : (
              unselectedOptions.map(opt => {
                const optVal = typeof opt.value === 'number' ? opt.value : Number(opt.value);
                const isSelected = value.map(Number).includes(optVal);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    className={clsx(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors",
                      isSelected
                        ? "bg-primary-50/50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs text-rose-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
};

export default MultiSelect;
