import React, { useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const { isAdminVerified, checkAdminSession } = useAdminAuth();
  const location = useLocation();

  useEffect(() => {
    checkAdminSession();
  }, [checkAdminSession]);

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not verified as admin
  if (!isAdminVerified) {
    return <Navigate to="/admin-verify" replace />;
  }

  // Verified admin
  return children;
};

export default ProtectedAdminRoute;
