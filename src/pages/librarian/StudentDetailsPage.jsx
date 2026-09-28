import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Alert } from '../../components/ui/Alert';
import {
  ArrowLeft,
  User,
  BookOpen,
  History,
  DollarSign,
  Bell,
  Clock,
  ClipboardCheck,
  CreditCard,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  Phone
} from 'lucide-react';
import { formatRollNumber } from '../../lib/utils';

export const StudentDetailsPage = () => {
  const { identifier, rollNumber } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const targetId = identifier || rollNumber;
  const explicitType = searchParams.get('type'); // 'STUDENT' or 'FACULTY'

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const isLibrarian = user?.role === 'LIBRARIAN';
  const backUrl = isLibrarian ? '/librarian/users' : '/admin/users';

  const fetchUserDetails = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    setErrorMsg(null);
    setErrorCode(null);

    try {
      const params = explicitType ? { type: explicitType } : undefined;
      const res = await userApi.getUserDetails(targetId, params);
      if (res?.data?.success) {
        setData(res.data.data);
      } else if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      setErrorCode(err.status || 500);
      setErrorMsg(err.message || 'Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }, [targetId, explicitType]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (errorMsg || (!data?.student && !data?.faculty)) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <Button variant="outline" size="sm" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to User Directory
        </Button>

        <Alert variant="destructive" className="p-6 space-y-3">
          <div className="flex items-center space-x-3 text-rose-800">
            <ShieldAlert className="w-7 h-7 shrink-0 text-rose-600" />
            <div>
              <h2 className="text-lg font-bold">
                {errorCode === 404
                  ? 'User Not Found'
                  : errorCode === 403
                  ? 'Access Denied'
                  : 'Unable to Load User Details'}
              </h2>
              <p className="text-xs text-rose-700 mt-0.5">
                {errorMsg || 'User account not found.'}
              </p>
            </div>
          </div>
        </Alert>

        <div className="text-center pt-4">
          <Link to={backUrl}>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">
              Return to User Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { student, faculty, userType, currentBorrows = [], borrowHistory = [], fines = [], payments = [], notifications = [], visits = [], tcClearance, outstandingFine = 0 } = data;
  const isFaculty = userType === 'FACULTY' || !!faculty;
  const userInfo = faculty || student;

  const activeVisit = visits.find((v) => v.visitStatus === 'INSIDE');

  const baseTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'current', label: `Current Books (${currentBorrows.length})`, icon: BookOpen },
    { id: 'history', label: `Borrow History (${borrowHistory.length})`, icon: History },
    { id: 'fines', label: `Fine History (${fines.length})`, icon: DollarSign },
    { id: 'notifications', label: `Notifications (${notifications.length})`, icon: Bell },
  ];

  const facultyExtraTabs = [
    { id: 'visits', label: `Library Visits (${visits.length})`, icon: Clock },
  ];

  const studentExtraTabs = [
    { id: 'payments', label: `Payment History (${payments.length})`, icon: CreditCard },
    { id: 'visits', label: `Library Visits (${visits.length})`, icon: Clock },
    { id: 'tc', label: 'TC Clearance', icon: ClipboardCheck },
  ];

  const tabs = isFaculty ? [...baseTabs, ...facultyExtraTabs] : [...baseTabs, ...studentExtraTabs];

  const userIdentifier = formatRollNumber(userInfo.facultyId || userInfo.rollNumber);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(backUrl)}
            className="mb-2 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to User Directory
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{userInfo.name}</h1>
            <span className="font-mono text-sm font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-md border border-slate-200 uppercase">
              {userIdentifier}
            </span>
            <Badge variant={isFaculty ? 'secondary' : 'outline'}>
              {isFaculty ? 'FACULTY' : 'STUDENT'}
            </Badge>
            <Badge variant={userInfo.status === 'ACTIVE' ? 'success' : 'danger'} className="font-bold">
              {userInfo.status}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {isFaculty ? (
              `Faculty Member • Email: ${userInfo.email || 'N/A'} • Phone: ${userInfo.phone || 'N/A'}`
            ) : (
              `${userInfo.department} • Academic Year ${userInfo.academicYear} (Section ${userInfo.section || 'A'}) • Gender: ${userInfo.gender}`
            )}
          </p>
        </div>

        {/* Quick Contextual Actions */}
        {isLibrarian && (
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/librarian/issue?rollNumber=${userIdentifier}`}>
              <Button size="sm" className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-xs">
                <ArrowUpRight className="w-4 h-4 mr-1" /> Issue Book
              </Button>
            </Link>

            <Link to={`/librarian/return?rollNumber=${userIdentifier}`}>
              <Button size="sm" variant="outline" className="border-[#C3A29E] hover:bg-[#E8DBC5]/50 text-[#8D6B94] font-bold text-xs">
                <ArrowDownLeft className="w-4 h-4 mr-1" /> Return Book
              </Button>
            </Link>

            <Link to={`/librarian/fines?rollNumber=${userIdentifier}`}>
              <Button size="sm" variant="outline" className="border-amber-200 hover:bg-amber-50 text-amber-700 font-bold text-xs">
                <DollarSign className="w-4 h-4 mr-1" /> Fine Clearance
              </Button>
            </Link>

            {!isFaculty && (
              <Link to={`/librarian/tc-clearance?rollNumber=${userIdentifier}`}>
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs">
                  <ClipboardCheck className="w-4 h-4 mr-1" /> TC Clearance
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Books Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Current Borrowed Books</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {currentBorrows.length} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">active</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {currentBorrows.filter((b) => b.status === 'OVERDUE').length > 0
                  ? `${currentBorrows.filter((b) => b.status === 'OVERDUE').length} overdue book(s)`
                  : 'All borrowings within due date'}
              </p>
            </div>
            <div className="p-3 bg-[#E8DBC5]/50 dark:bg-[#2D2534] text-[#8D6B94] dark:text-[#B185A7] rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Fine Card */}
        <Card className={`border-2 shadow-xs transition-all ${outstandingFine > 0 ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/40' : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/30'}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Outstanding Fine</span>
              <div className={`text-2xl font-black mt-1 ${outstandingFine > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
                ₹{outstandingFine}
              </div>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                {outstandingFine > 0 ? 'Fine payment pending' : 'No Outstanding Fine'}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${outstandingFine > 0 ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'}`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: TC Clearance for Student, Total Borrowings for Faculty */}
        {isFaculty ? (
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Borrowings</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {borrowHistory.length} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">total</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Lifetime books borrowed
                </p>
              </div>
              <div className="p-3 bg-[#8D6B94]/15 text-[#8D6B94] dark:bg-[#8D6B94]/30 dark:text-[#B185A7] rounded-xl">
                <History className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className={`border-2 shadow-xs transition-all ${tcClearance?.status === 'READY_FOR_TC' ? 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/40' : 'border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/40'}`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">TC Clearance Status</span>
                <div className="mt-1">
                  <Badge
                    className={`text-xs font-black px-2.5 py-0.5 uppercase ${
                      tcClearance?.status === 'READY_FOR_TC' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    {tcClearance?.decision || 'HOLD'}
                  </Badge>
                </div>
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  {tcClearance?.status === 'READY_FOR_TC' ? 'Eligible for exit clearance' : `${tcClearance?.reasons?.length || 1} pending obligation(s)`}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${tcClearance?.status === 'READY_FOR_TC' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'}`}>
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Library Visit Status Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Library Entrance</span>
              <div className="mt-1">
                <Badge variant={activeVisit ? 'success' : 'secondary'} className="font-bold">
                  {activeVisit ? 'INSIDE LIBRARY' : 'NOT CHECKED IN'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Total visits logged: <strong className="text-slate-800 dark:text-slate-200">{visits.length}</strong>
              </p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <div className="flex space-x-2 min-w-max">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#8D6B94] dark:border-[#B185A7] text-[#8D6B94] dark:text-[#B185A7] bg-[#E8DBC5]/50 dark:bg-[#2D2534] rounded-t-lg'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3">
                <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                  {isFaculty ? 'Faculty Profile Details' : 'Student Profile Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{userInfo.name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">
                      {isFaculty ? 'Faculty ID' : 'Roll Number'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs uppercase">
                      {userIdentifier}
                    </span>
                  </div>
                  {!isFaculty && (
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">Gender</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{userInfo.gender}</span>
                    </div>
                  )}
                  {isFaculty && (
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">User Type</span>
                      <Badge variant="secondary" className="text-[10px]">
                        FACULTY
                      </Badge>
                    </div>
                  )}
                </div>

                {!isFaculty && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{userInfo.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">Year & Section</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Year {userInfo.academicYear} ({userInfo.section || 'A'})</span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">Contact Email</span>
                  <div className="flex items-center space-x-1.5 font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{userInfo.email || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">Contact Phone</span>
                  <div className="flex items-center space-x-1.5 font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{userInfo.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">Account Status</span>
                    <Badge variant={userInfo.status === 'ACTIVE' ? 'success' : 'danger'} className="mt-0.5 font-bold">
                      {userInfo.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-bold uppercase text-[10px]">Registration Date</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold block mt-0.5">
                      {userInfo.registrationDate ? new Date(userInfo.registrationDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overview Right Column: Current Books Quick View & TC Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Borrows Overview */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                    Current Borrowed Books ({currentBorrows.length})
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('current')} className="text-xs text-[#8D6B94] dark:text-[#B185A7] font-bold p-0 hover:bg-transparent">
                    View Details &rarr;
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {currentBorrows.length === 0 ? (
                    <div className="p-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                      No active borrowed books.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentBorrows.slice(0, 3).map((b) => (
                        <div key={b.transactionId} className="p-4 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{b.bookTitle}</div>
                            <div className="text-slate-400 dark:text-slate-500 text-[11px] font-mono mt-0.5">
                              Book ID: {b.bookId || b.id || b.masterBook?._id} • Copy ID: {b.barcode || b.copyId || 'N/A'}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                              Issued: {new Date(b.issueDate).toLocaleDateString()} • Due: <strong className="text-slate-800 dark:text-slate-200">{new Date(b.dueDate).toLocaleDateString()}</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={b.status === 'OVERDUE' ? 'danger' : 'warning'} className="font-bold">
                              {b.status}
                            </Badge>
                            {b.overdueDays > 0 && (
                              <div className="text-rose-600 dark:text-rose-400 font-bold text-[11px] mt-1">
                                {b.overdueDays} days late • Fine: ₹{b.currentFine}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* TC Clearance & Fine Obligations Overview */}
              {!isFaculty && (
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3">
                    <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                      TC Clearance & Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[11px]">Clearance Status</span>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">{tcClearance?.decision || 'HOLD'}</strong>
                      </div>
                      <Badge className={tcClearance?.status === 'READY_FOR_TC' ? 'bg-emerald-600 text-white font-bold' : 'bg-amber-600 text-white font-bold'}>
                        {tcClearance?.status === 'READY_FOR_TC' ? 'READY FOR TC' : 'HOLD'}
                      </Badge>
                    </div>

                    {tcClearance?.reasons?.length > 0 && (
                      <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-1">
                        <span className="font-bold block text-[11px] uppercase text-amber-800 dark:text-amber-300">Clearance Hold Reasons:</span>
                        <ul className="list-disc list-inside space-y-0.5 font-semibold text-[11px]">
                          {tcClearance.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* CURRENT BOOKS TAB */}
        {activeTab === 'current' && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Current Borrowed Books ({currentBorrows.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {currentBorrows.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  No active borrowed books.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Book Title</th>
                        <th className="p-3">Book ID / Copy ID</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Overdue Days</th>
                        <th className="p-3 pr-4 text-right">Current Fine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {currentBorrows.map((b) => (
                        <tr key={b.transactionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white text-sm">{b.bookTitle}</td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                            <div>{b.bookId || b.id || b.masterBook?._id}</div>
                            {b.barcode && <div className="text-[10px] text-slate-400 dark:text-slate-500">Copy ID: {b.barcode}</div>}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{new Date(b.issueDate).toLocaleDateString()}</td>
                          <td className="p-3 font-bold text-[#795B80] dark:text-[#B185A7]">{new Date(b.dueDate).toLocaleDateString()}</td>
                          <td className="p-3">
                            <Badge variant={b.status === 'OVERDUE' ? 'danger' : 'warning'} className="font-bold">
                              {b.status}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{b.overdueDays}</td>
                          <td className="p-3 pr-4 text-right font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                            ₹{b.currentFine}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* BORROW HISTORY TAB */}
        {activeTab === 'history' && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Borrowing History ({borrowHistory.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {borrowHistory.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  No borrowing history available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Book Title</th>
                        <th className="p-3">Book ID</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Return Date</th>
                        <th className="p-3">Condition</th>
                        <th className="p-3">Borrow Status</th>
                        <th className="p-3">Overdue Fine</th>
                        <th className="p-3">Condition Fine</th>
                        <th className="p-3 pr-4 text-right">Total Fine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {borrowHistory.map((b) => (
                        <tr key={b.transactionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">{b.bookTitle}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">{b.bookId}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{new Date(b.issueDate).toLocaleDateString()}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{new Date(b.dueDate).toLocaleDateString()}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '—'}</td>
                          <td className="p-3">
                            <Badge
                              variant={b.returnCondition === 'GOOD' ? 'success' : 'danger'}
                              className="font-bold text-[10px]"
                            >
                              {b.returnCondition}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-bold text-[10px]">
                              {b.borrowStatus}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-slate-800 dark:text-slate-200">₹{b.overdueFine}</td>
                          <td className="p-3 font-mono text-slate-800 dark:text-slate-200">₹{b.conditionFine}</td>
                          <td className="p-3 pr-4 text-right font-mono font-bold text-slate-900 dark:text-white">₹{b.totalFine}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FINE HISTORY TAB */}
        {activeTab === 'fines' && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Fine History ({fines.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {fines.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  No fine records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Fine ID</th>
                        <th className="p-3">Book Title</th>
                        <th className="p-3">Fine Reason</th>
                        <th className="p-3">Original Amount</th>
                        <th className="p-3">Paid Amount</th>
                        <th className="p-3">Outstanding</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 pr-4 text-right">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {fines.map((f) => (
                        <tr key={f.fineId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 pl-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">{String(f.fineId).slice(-6)}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{f.bookTitle}</td>
                          <td className="p-3">
                            <Badge variant="secondary" className="font-bold text-[10px]">
                              {f.reason}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono font-semibold text-slate-800 dark:text-slate-200">₹{f.originalAmount}</td>
                          <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400 font-bold">₹{f.paidAmount}</td>
                          <td className="p-3 font-mono text-rose-600 dark:text-rose-400 font-extrabold">₹{f.outstandingAmount}</td>
                          <td className="p-3">
                            <Badge
                              variant={f.status === 'PAID' ? 'success' : f.status === 'PENDING' ? 'warning' : 'secondary'}
                              className="font-bold"
                            >
                              {f.status}
                            </Badge>
                          </td>
                          <td className="p-3 pr-4 text-right text-slate-600 dark:text-slate-400">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PAYMENT HISTORY TAB */}
        {activeTab === 'payments' && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Payment History ({payments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  No payment history available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Payment Date</th>
                        <th className="p-3">Book / Item</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Remaining Balance</th>
                        <th className="p-3 pr-4 text-right">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {payments.map((p, idx) => (
                        <tr key={p.paymentId || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 pl-4 font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(p.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{p.bookTitle}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">₹{p.amount}</td>
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">₹{p.remainingOutstanding}</td>
                          <td className="p-3 pr-4 text-right">
                            <Badge variant="outline" className="font-bold">
                              {p.paymentMethod}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Library Notifications ({notifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  No notifications.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map((n) => (
                    <div key={n.notificationId} className="p-4 flex items-start justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="font-bold text-[10px]">
                            {n.type}
                          </Badge>
                          <strong className="text-slate-900 dark:text-white text-sm font-bold">{n.title}</strong>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-xs font-medium">{n.message}</p>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold pt-0.5">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={n.isRead ? 'secondary' : 'default'} className="font-bold text-[10px] shrink-0">
                        {n.isRead ? 'READ' : 'UNREAD'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* LIBRARY VISITS TAB */}
        {activeTab === 'visits' && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 py-3">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Library Visit History ({visits.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {visits.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  No library visits found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Library</th>
                        <th className="p-3">Check-In Time</th>
                        <th className="p-3">Check-Out Time</th>
                        <th className="p-3 pr-4 text-right">Visit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {visits.map((v) => (
                        <tr key={v.visitId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">{v.libraryName}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{new Date(v.checkInTime).toLocaleString()}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : '—'}
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <Badge
                              variant={v.visitStatus === 'INSIDE' ? 'success' : 'secondary'}
                              className="font-bold"
                            >
                              {v.visitStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TC CLEARANCE TAB */}
        {activeTab === 'tc' && (
          <div className="space-y-6">
            <Card className={`border-2 shadow-xs ${tcClearance?.status === 'READY_FOR_TC' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40' : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40'}`}>
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">TC CLEARANCE ELIGIBILITY</span>
                    <Badge className={tcClearance?.status === 'READY_FOR_TC' ? 'bg-emerald-600 text-white font-bold' : 'bg-rose-600 text-white font-bold'}>
                      {tcClearance?.decision || 'HOLD'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {tcClearance?.status === 'READY_FOR_TC'
                      ? 'Student is fully cleared for Transfer Certificate (TC) issuance.'
                      : 'Clearance on HOLD due to pending library obligations.'}
                  </h3>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
                    <div>• Active Borrowed Books: <strong>{tcClearance?.activeBooksCount || 0}</strong></div>
                    <div>• Outstanding Fine Amount: <strong>₹{tcClearance?.outstandingFine || 0}</strong></div>
                    <div>• Active Visit Status: <strong>{tcClearance?.activeVisit ? 'Checked In' : 'None'}</strong></div>
                  </div>
                </div>

                {isLibrarian && (
                  <Link to={`/librarian/tc-clearance?rollNumber=${formatRollNumber(student?.rollNumber || userIdentifier)}`}>
                    <Button className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-xs shrink-0 cursor-pointer">
                      Open TC Clearance Terminal &rarr;
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
