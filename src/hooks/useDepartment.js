import { useState, useCallback } from 'react';
import { departmentService } from '../services/departmentService';

export const useDepartment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDepartments = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      return await departmentService.getDepartments(params);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getDepartments, loading, error };
};

export default useDepartment;
