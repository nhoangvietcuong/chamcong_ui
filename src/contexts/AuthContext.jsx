import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await authService.me();
      if (response && response.success) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        clearAuth();
      }
    } catch (err) {
      console.error('Check auth error:', err);
      // Let Axios interceptor handle 401, but if it fails completely, clear
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      if (response && response.success && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Đăng nhập không thành công' };
    } catch (err) {
      clearAuth();
      return { 
        success: false, 
        message: err.message || 'Tên đăng nhập hoặc mật khẩu không hợp lệ.' 
      };
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  // Effect to run auth check on startup
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen to Axios unauthorized event for centralized logout
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        role: user?.role || null,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
