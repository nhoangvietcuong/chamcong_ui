import { useState, useCallback } from 'react';
import { assignmentService } from '../services/assignmentService';

export const useAssignment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAssignments = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      return await assignmentService.getAssignments(params);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getAssignments, loading, error };
};

export default useAssignment;
