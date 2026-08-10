import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingOverlay from '../components/Loading';
import { hasMinRole } from '../utils/role.utils';

export const RoleGuard = ({ allowedRoles, requiredMinRole }) => {
  const { role, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingOverlay active={true} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  let hasAccess = false;
  if (requiredMinRole) {
    hasAccess = hasMinRole(role, requiredMinRole);
  } else if (allowedRoles) {
    hasAccess = allowedRoles.includes(role);
  }

  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleGuard;
