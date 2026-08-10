import { useState, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getNotifications = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      return await notificationService.getNotifications(params);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getNotifications, loading, error };
};

export default useNotification;
