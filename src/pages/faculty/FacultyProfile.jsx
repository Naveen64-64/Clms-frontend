import React, { useState, useEffect } from 'react';
import { facultyApi } from '../../api/facultyApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { User, Mail, Phone, ShieldCheck, Briefcase } from 'lucide-react';

export const FacultyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await facultyApi.getMe();
      if (res?.data) {
        setProfile(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-[#8D6B94] dark:text-[#B185A7]" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Faculty Profile</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personal authenticated library portal account details.
        </p>
      </div>

      {error && (
        <div className="p-4 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
          {error}
        </div>
      )}

      {profile && (
        <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#8D6B94] dark:text-[#B185A7]" />
                  {profile.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Faculty Member • KDL - KIET Digital Library Access
                </CardDescription>
              </div>
              <Badge variant="success" className="px-3 py-1 text-xs">
                {profile.isActive ? 'ACTIVE ACCOUNT' : 'INACTIVE'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block mb-1">
                  Faculty ID
                </span>
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white uppercase">
                  {profile.facultyId}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block mb-1">
                  Full Name
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {profile.name}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-extrabold uppercase">Email Address</span>
                </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {profile.email}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-extrabold uppercase">Phone Number</span>
                </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {profile.phone}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                Centralized Access: KIET, KIET 2, KIET Women's Library
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
