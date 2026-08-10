import { useState } from 'react';
import api from '../services/api';

export const useAxios = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (config) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api(config);
      return res.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error, api };
};

export default useAxios;
