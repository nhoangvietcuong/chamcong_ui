import { useState, useCallback } from 'react';
import { employeeService } from '../services/employeeService';

export const useEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getEmployees = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      return await employeeService.getEmployees(params);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getEmployees, loading, error };
};

export default useEmployee;
