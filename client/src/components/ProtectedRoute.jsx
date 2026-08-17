import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    // If not logged in, redirect to login page based on role requested
    const loginRedirect = allowedRole === 'doctor' ? '/doctor/login' : '/patient/login';
    return <Navigate to={loginRedirect} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If logged in but role mismatch, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
