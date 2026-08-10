import { useState, useCallback } from 'react';

export const useSearch = (initialValue = '') => {
  const [keyword, setKeyword] = useState(initialValue);

  const handleSearch = useCallback((value) => {
    setKeyword(value);
  }, []);

  const resetSearch = useCallback(() => {
    setKeyword('');
  }, []);

  return { keyword, setKeyword, handleSearch, resetSearch };
};

export default useSearch;
