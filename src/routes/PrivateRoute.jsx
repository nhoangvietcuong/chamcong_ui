import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingOverlay from '../components/Loading';

export const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay active={true} />;
  }

  return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Outlet />;
};

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay active={true} />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
