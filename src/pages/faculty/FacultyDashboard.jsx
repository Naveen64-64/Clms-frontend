import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { facultyApi } from '../../api/facultyApi';
import { libraryApi } from '../../api/libraryApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  BookOpen,
  History,
  AlertTriangle,
  DollarSign,
  Building,
  ArrowRight,
  Search,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { user, facultyProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [facRes, libRes] = await Promise.all([
        facultyApi.getMe(),
        libraryApi.getAllLibraries()
      ]);

      if (facRes?.data) {
        setProfileData(facRes.data);
      }
      if (libRes?.data) {
        setLibraries(libRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load faculty dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = profileData?.stats || {
    activeLoans: 0,
    overdueCount: 0,
    totalBorrowings: 0,
    pendingFines: 0
  };

  const facultyName = profileData?.name || facultyProfile?.name || user?.username || 'Faculty Member';
  const facultyId = profileData?.facultyId || facultyProfile?.facultyId || 'FAC';

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header / Welcome Portal Banner */}
      <div className="bg-gradient-to-r from-[#302731] via-[#8D6B94] to-[#B185A7] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#E8DBC5] text-xs font-bold uppercase tracking-wider mb-1">
              <span>KDL - KIET Digital Library</span>
              <span>•</span>
              <span>Faculty Library Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome, {facultyName}
            </h1>
            <p className="text-xs text-[#FFF4E9]/80 mt-1">
              Faculty ID: <span className="font-mono font-bold">{facultyId}</span> • Centralized library access across all 3 campuses
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate('/faculty/books')}
              className="bg-[#FFF4E9] hover:bg-white text-[#8D6B94] font-bold text-xs"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Book Catalog
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Loans */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                ACTIVE LOANS
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.activeLoans}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Books currently borrowed
              </p>
            </div>
            <div className="p-3 bg-[#8D6B94]/15 text-[#8D6B94] dark:bg-[#8D6B94]/30 dark:text-[#B185A7] rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Overdue Books */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                OVERDUE BOOKS
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.overdueCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.overdueCount > 0 ? 'Requires immediate return' : 'No overdue loans'}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${stats.overdueCount > 0 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Borrowing History */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                BORROWED HISTORY
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.totalBorrowings}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Total lifetime loans
              </p>
            </div>
            <div className="p-3 bg-[#B185A7]/20 text-[#8D6B94] dark:bg-[#B185A7]/30 dark:text-[#B185A7] rounded-xl">
              <History className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Fines */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                PENDING FINES
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ₹{stats.pendingFines}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.pendingFines > 0 ? 'Pending fine payment' : 'Zero outstanding fine'}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centralized Library Live Availability Panel */}
      <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-[#8D6B94] dark:text-[#B185A7]" />
                Centralized Library Campus Status
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Faculty members have unrestricted access to all 3 college libraries.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              All Libraries Accessible
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {libraries.length > 0 ? (
              libraries.map((lib) => (
                <div
                  key={lib._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{lib.name}</h3>
                    <Badge variant="default" className="text-[10px]">
                      {lib.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{lib.description || lib.location}</p>
                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Opening Hours:</span>
                    <span>{lib.openingTime || '09:00 AM'} - {lib.closingTime || '05:00 PM'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-xs text-slate-500 p-4">
                Loading campus library holdings...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
