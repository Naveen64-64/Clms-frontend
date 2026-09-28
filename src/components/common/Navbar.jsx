import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, ArrowLeft, Menu, X, BookOpen, Home, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Logo } from './Logo';

export const Navbar = ({ isHome }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isLoginPage = location.pathname === '/login';
  const isHomePage = isHome ?? (location.pathname === '/' || location.pathname === '/libraries');

  const getDashboardPath = () => {
    if (role === 'STUDENT') return '/student/dashboard';
    if (role === 'LIBRARIAN') return '/librarian/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'LIBRARY_ENTRANCE') return '/library-entrance/dashboard';
    return '/catalog';
  };

  const handleBack = () => {
    navigate('/');
  };

  if (isLoginPage) {
    return (
      <header className="relative z-40 w-full pt-1 pb-3">
        <div className="flex h-14 items-center justify-between">
          <RouterLink
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#8D6B94] hover:text-[#B185A7] transition-all px-4 py-2 rounded-full bg-[#E8DBC5]/50 hover:bg-[#E8DBC5]/80 border border-[#E8DBC5] cursor-pointer shadow-2xs"
            aria-label="Back to home page"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </RouterLink>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="relative z-40 w-full pt-1 pb-3">
        <div className="flex h-14 items-center justify-between gap-2">
          {/* Official Brand Logo & Title */}
          <RouterLink to="/" aria-label="KDL Home" className="shrink-0 min-w-0">
            <Logo size="md" className="max-w-[200px] xs:max-w-none" isLight={isHomePage} />
          </RouterLink>

          {/* Desktop Navigation Links (>= md) */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <RouterLink
              to="/"
              className={`text-xs font-semibold transition-all px-4 py-2 rounded-full ${
                isHomePage
                  ? 'bg-white/20 backdrop-blur-md text-[#FFF4E9] font-bold border border-white/25 shadow-xs'
                  : location.pathname === '/'
                  ? 'bg-[#E8DBC5]/80 text-[#8D6B94] font-bold shadow-2xs'
                  : 'text-[#2B232E]/90 hover:text-[#8D6B94]'
              }`}
            >
              Home & Seat Status
            </RouterLink>
            <RouterLink
              to="/catalog"
              className={`text-xs font-semibold transition-all px-4 py-2 rounded-full ${
                isHomePage
                  ? 'text-white/90 hover:text-white hover:bg-white/15'
                  : location.pathname === '/catalog'
                  ? 'bg-[#E8DBC5]/80 text-[#8D6B94] font-bold shadow-2xs'
                  : 'text-[#2B232E]/90 hover:text-[#8D6B94]'
              }`}
            >
              Book Catalog
            </RouterLink>
          </nav>

          {/* Actions: Desktop Auth Controls & Mobile Menu Trigger */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Desktop Auth Controls */}
            <div className="hidden sm:flex items-center space-x-2">
              {user ? (
                <>
                  <RouterLink to={getDashboardPath()}>
                    <Button size="sm" variant="default" className="font-bold rounded-full px-4 lg:px-5 bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] shadow-md shadow-[#8D6B94]/20 border border-[#B185A7]/30">
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      Portal ({role})
                    </Button>
                  </RouterLink>
                  <Button size="sm" variant="outline" onClick={logout} className={`rounded-full px-3.5 ${
                    isHomePage ? 'border-white/60 text-white hover:bg-white/15' : 'border-[#8D6B94] text-[#8D6B94] hover:bg-[#8D6B94]/10'
                  }`}>
                    Logout
                  </Button>
                </>
              ) : (
                <RouterLink to="/login">
                  <Button size="sm" variant="default" className="font-bold rounded-full px-4 sm:px-5 h-9 bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] shadow-md shadow-[#8D6B94]/20 border border-[#B185A7]/30">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Sign In
                  </Button>
                </RouterLink>
              )}
            </div>

            {/* Mobile Hamburger Menu Button (< md) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`md:hidden p-2 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer ${
                isHomePage
                  ? 'bg-white/20 backdrop-blur-md text-white hover:text-white border border-white/30'
                  : 'bg-white/80 dark:bg-[#251E27]/80 text-[#8D6B94] hover:text-[#2B232E] border border-[#E8DBC5]'
              }`}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#2B232E]/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-4/5 max-w-[320px] h-full bg-[#FFF4E9] dark:bg-[#211A22] border-l border-[#E8DBC5] dark:border-[#3B3142] shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 transition-transform duration-300 ease-out">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#E8DBC5]/80 pb-4">
                <Logo size="sm" subtitle="KIET Digital Library" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#7A697E] hover:text-[#2B232E] hover:bg-[#E8DBC5]/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                <RouterLink
                  to="/"
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    location.pathname === '/'
                      ? 'bg-[#8D6B94] text-[#FFF4E9] shadow-sm'
                      : 'text-[#2B232E] dark:text-[#FFF4E9] hover:bg-[#E8DBC5]/60'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home & Seat Status</span>
                </RouterLink>

                <RouterLink
                  to="/catalog"
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    location.pathname === '/catalog'
                      ? 'bg-[#8D6B94] text-[#FFF4E9] shadow-sm'
                      : 'text-[#2B232E] dark:text-[#FFF4E9] hover:bg-[#E8DBC5]/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Book Catalog</span>
                </RouterLink>
              </nav>

              {/* User Details & Portal Link if Logged In */}
              {user && (
                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#2B232E]/80 border border-[#E8DBC5] dark:border-[#3B3142] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2B232E] dark:text-[#FFF4E9] truncate">
                      {user?.username || 'User'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8D6B94]/15 text-[#8D6B94]">
                      {role}
                    </span>
                  </div>
                  <RouterLink to={getDashboardPath()} className="block">
                    <Button size="sm" className="w-full font-bold bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9]">
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      Open My Portal
                    </Button>
                  </RouterLink>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-[#E8DBC5]/80 space-y-3">
              {user ? (
                <Button
                  variant="outline"
                  onClick={logout}
                  className="w-full flex items-center justify-center space-x-2 border-[#8D6B94] text-[#8D6B94] hover:bg-[#8D6B94]/10 font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              ) : (
                <RouterLink to="/login" className="block">
                  <Button className="w-full font-bold bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] shadow-md shadow-[#8D6B94]/20">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Sign In to Portal
                  </Button>
                </RouterLink>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
