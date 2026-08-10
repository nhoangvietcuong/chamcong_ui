import { useState, useCallback } from 'react';

export const useFilter = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return { filters, setFilters, setFilter, resetFilters };
};

export default useFilter;
