import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { AmbientGlows } from '../common/AmbientGlows';
import { useAuth } from '../../context/AuthContext';
import { AuthLoadingScreen } from '../common/AuthLoadingScreen';
import { cn } from '../../lib/utils';

export const PublicLayout = () => {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  const isLandingPage = location.pathname === '/' || location.pathname === '/libraries';

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FFF4E9] text-[#2B232E] transition-colors overflow-x-hidden">
      {!isLandingPage && <AmbientGlows />}
      <div className="relative z-10 flex flex-col flex-1 w-full min-w-0">
        {/* Floating Navbar on Landing Page (Extending over background image) vs standard container on catalog/login */}
        <header
          className={cn(
            'w-full z-40',
            isLandingPage
              ? 'absolute top-0 left-0 right-0'
              : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3'
          )}
        >
          <div className={isLandingPage ? 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4' : ''}>
            <Navbar isHome={isLandingPage} />
          </div>
        </header>

        {/* Main Content Area: Full-bleed on landing page, padded container on inner pages */}
        <main
          className={cn(
            'flex-1 w-full min-w-0',
            !isLandingPage && 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6'
          )}
        >
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

