import { useState, useCallback } from 'react';

export const usePagination = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    resetPagination,
  };
};
export default usePagination;
