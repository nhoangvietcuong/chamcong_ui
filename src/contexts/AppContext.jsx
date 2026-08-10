import React, { createContext, useState, useCallback } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showLoading = useCallback((show) => {
    setGlobalLoading(show);
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    warning: (msg) => addToast(msg, 'warning'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <AppContext.Provider
      value={{
        globalLoading,
        showLoading,
        toasts,
        addToast,
        removeToast,
        toast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
