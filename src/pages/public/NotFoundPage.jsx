import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export const NotFoundPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'LIBRARIAN') return '/librarian/dashboard';
    if (role === 'STUDENT') return '/student/dashboard';
    if (role === 'FACULTY') return '/faculty/dashboard';
    if (role === 'LIBRARY_ENTRANCE') return '/library-entrance/dashboard';
    return '/';
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 py-12">
      <div className="max-w-md w-full text-center space-y-5 bg-white dark:bg-[#251E27] p-8 rounded-2xl shadow-sm border border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)]">
        <div className="inline-flex p-4 bg-[#E8DBC5]/50 dark:bg-[#302731] text-[#8D6B94] dark:text-[#B185A7] rounded-full">
          <Compass className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">404</h1>
          <h2 className="text-lg font-bold text-[#2B232E] dark:text-[#FFF4E9]">Page Not Found</h2>
          <p className="text-xs text-[#7A697E] dark:text-[#D1C2D4] max-w-sm mx-auto leading-relaxed">
            The page you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
          <Link to={getDashboardPath()}>
            <Button size="sm" className="gap-1.5 bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] cursor-pointer">
              <Home className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
