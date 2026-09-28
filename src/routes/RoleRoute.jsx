import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ShieldAlert } from 'lucide-react';
import { useNavigate, Outlet } from 'react-router-dom';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  if (!allowedRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto my-12 p-4">
        <Alert variant="destructive" className="space-y-3 dark:bg-rose-950/40 dark:border-rose-900/60">
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-base">
            <ShieldAlert className="h-5 w-5" />
            <span>403 Access Forbidden</span>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
            Your role (<strong className="text-rose-950 dark:text-rose-200">{role}</strong>) does not have authorization to view this resource. Contact institution administration if you believe this is an error.
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate(-1)} className="mt-2 bg-white dark:bg-slate-900 dark:border-slate-700 cursor-pointer">
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  return children ? children : <Outlet />;
};
