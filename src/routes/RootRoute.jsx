import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/common/AuthLoadingScreen';
import { LandingPage } from '../pages/public/LandingPage';

export const RootRoute = () => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user && role !== 'OPEN_USER') {
    const targetRoute = getDashboardRoute(role);
    if (targetRoute && targetRoute !== '/') {
      return <Navigate to={targetRoute} replace />;
    }
  }

  return <LandingPage />;
};
