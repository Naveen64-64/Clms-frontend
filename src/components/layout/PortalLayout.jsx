import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { TopNav } from '../common/TopNav';
import { Footer } from '../common/Footer';
import { AmbientGlows } from '../common/AmbientGlows';
import { cn } from '../../lib/utils';

export const PortalLayout = () => {
  const location = useLocation();
  const mainScrollRef = useRef(null);

  // Remember sidebar state or default to open on wide desktop screens (>= 1280px)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clms_sidebar_open');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 1280;
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('clms_sidebar_open', String(sidebarOpen));
    } catch {
      // Ignore storage errors
    }
  }, [sidebarOpen]);

  // Prevent unwanted document/body scroll while inside authenticated portal shell
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Reset vertical scroll position to top when navigating between routes
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="relative h-screen h-dvh max-h-screen max-h-dvh w-full max-w-[100vw] overflow-hidden flex bg-[#FFF4E9] dark:bg-[#211A22] text-[#2B232E] dark:text-[#FFF4E9] transition-colors">
      <AmbientGlows />

      {/* Shared Fixed / Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Workspace (Resizes alongside Sidebar on Desktop) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full max-h-full overflow-hidden w-full transition-[width,margin] duration-300 ease-in-out">
        {/* Top Header Navigation (Fixed at top of workspace, does not scroll with content) */}
        <TopNav
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
          isSidebarOpen={sidebarOpen}
        />

        {/* Dedicated Independently Scrollable Region for Main Content */}
        <div
          ref={mainScrollRef}
          id="portal-main-scroll"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden min-w-0 flex flex-col scroll-smooth"
        >
          {/* Main Dashboard Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto relative z-10 min-w-0">
            <Outlet />
          </main>

          {/* Global Footer (Sticks at bottom of content or viewport) */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

