import React, { forwardRef } from 'react';
import { FiCalendar } from 'react-icons/fi';
import Input from './Input';

export const DatePicker = forwardRef(({ label, error, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      type="date"
      label={label}
      error={error}
      icon={<FiCalendar className="w-4 h-4" />}
      {...props}
    />
  );
});

DatePicker.displayName = 'DatePicker';
export default DatePicker;
