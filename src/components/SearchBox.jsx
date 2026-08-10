import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import Input from './Input';

export const SearchBox = ({ value, onChange, placeholder = 'Tìm kiếm...', className, ...props }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (onChangeRef.current) {
        onChangeRef.current(searchTerm);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <Input
      type="text"
      name="search"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder={placeholder}
      icon={<FiSearch className="w-4 h-4" />}
      className={className}
      containerClassName="w-full"
      {...props}
    />
  );
};

export default SearchBox;
