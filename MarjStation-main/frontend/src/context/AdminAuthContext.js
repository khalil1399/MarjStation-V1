import React, { createContext, useState, useContext } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  const verifyAdmin = () => {
    setIsAdminVerified(true);
    // Set expiration for admin session (30 minutes)
    localStorage.setItem('adminVerified', Date.now() + (30 * 60 * 1000));
  };

  const clearAdminAuth = () => {
    setIsAdminVerified(false);
    localStorage.removeItem('adminVerified');
  };

  const checkAdminSession = () => {
    const expiry = localStorage.getItem('adminVerified');
    if (expiry && Date.now() < parseInt(expiry)) {
      setIsAdminVerified(true);
      return true;
    }
    clearAdminAuth();
    return false;
  };

  const value = {
    isAdminVerified,
    verifyAdmin,
    clearAdminAuth,
    checkAdminSession
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
