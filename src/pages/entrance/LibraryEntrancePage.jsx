import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { entryExitApi } from '../../api/entryExitApi';
import { libraryApi } from '../../api/libraryApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LibrarySelect } from '../../components/common/LibrarySelect';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import {
  BookOpen,
  LogOut,
  ArrowRightCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  ShieldAlert,
  QrCode
} from 'lucide-react';
import { ThemeSwitcher } from '../../components/common/ThemeSwitcher';
import { Footer } from '../../components/common/Footer';

const LIBRARIES_LIST = [
  { code: 'KIET_MAIN', name: 'KIET Library' },
  { code: 'KIET_2', name: 'KIET 2 Library' },
  { code: 'KIET_WOMEN', name: "KIET Women's Library" }
];

export const LibraryEntrancePage = () => {
  const { user, logout } = useAuth();
  const [selectedLibrary, setSelectedLibrary] = useState('KIET_MAIN');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [libraryStatus, setLibraryStatus] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchLibraryData = async (libCode) => {
    if (!libCode) return;
    // Run both fetches independently so a failure in one doesn't kill the other
    const [recentRes, statusRes] = await Promise.allSettled([
      entryExitApi.getRecentVisits(libCode),
      libraryApi.getSeatStatus(libCode)
    ]);

    if (recentRes.status === 'fulfilled' && recentRes.value?.data) {
      setRecentVisits(recentRes.value.data);
    }
    if (statusRes.status === 'fulfilled' && statusRes.value?.data) {
      setLibraryStatus(statusRes.value.data);
    }
  };

  useEffect(() => {
    fetchLibraryData(selectedLibrary);

    let eventSource = null;
    try {
      eventSource = new EventSource('/api/v1/libraries/occupancy-stream');
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'OCCUPANCY_UPDATE' || data.libraryCode === selectedLibrary) {
            fetchLibraryData(selectedLibrary);
          }
        } catch (err) {}
      };
    } catch (err) {}

    const pollInterval = setInterval(() => {
      fetchLibraryData(selectedLibrary);
    }, 3000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [selectedLibrary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLibrary) {
      setErrorInfo({ title: 'Validation Error', message: 'Please select a library.' });
      return;
    }

    const trimmedId = userId.trim();
    if (!trimmedId) {
      setErrorInfo({ title: 'Validation Error', message: 'Please enter a User ID.' });
      return;
    }

    setLoading(true);
    setResult(null);
    setErrorInfo(null);

    try {
      const res = await entryExitApi.scanUserId(trimmedId, selectedLibrary);
      if (res?.data) {
        setResult(res.data);
        setUserId('');
        fetchLibraryData(selectedLibrary);
      }
    } catch (err) {
      const errResponse = err.response?.data;
      setErrorInfo({
        title: errResponse?.message || 'Check-IN / Check-OUT Rejected',
        message: errResponse?.errorDetails?.reason || err.message || 'Operation failed',
        code: errResponse?.errorCode,
        activeLibraryName: errResponse?.errorDetails?.activeLibraryName,
        userId: trimmedId
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const selectedLibObj = LIBRARIES_LIST.find((l) => l.code === selectedLibrary);

  return (
    <div className="min-h-screen bg-[#FFF4E9] dark:bg-[#161219] text-[#2B232E] dark:text-[#FFF4E9] transition-colors flex flex-col font-sans">
      {/* Top Gate Header Bar */}
      <header className="bg-[#211C26] text-white border-b border-[#3B3142] shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#8D6B94] rounded-xl text-white shadow-2xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight">KDL - KIET Digital Library</h1>
              <p className="text-xs text-[#B185A7] font-medium">Library Entrance Gate</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-[#B8A6BD] uppercase font-semibold">Logged in staff</p>
              <p className="text-xs font-bold text-[#FFF4E9]">{user?.username || user?.email || 'libraryentrance@gmail.com'}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-[#FFF4E9] border-[#3B3142] hover:bg-[#2D2534]"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Entrance Control View */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DBC5] dark:border-[#3B3142] pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight flex items-center gap-2">
              <UserCheck className="w-7 h-7 text-[#8D6B94] dark:text-[#B185A7]" />
              Library Entrance
            </h2>
            <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] font-medium">Library Entry & Exit</p>
          </div>
        </div>

        {/* Entrance Gate Control Card */}
        <Card className="border-[#E8DBC5] dark:border-[#3B3142] shadow-sm bg-white dark:bg-[#211C26] overflow-hidden">
          <CardHeader className="bg-[#FFF4E9]/60 dark:bg-[#1A151E] border-b border-[#E8DBC5]/60 dark:border-[#3B3142] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#8D6B94] dark:text-[#B185A7]" />
                Gate Terminal Controls
              </CardTitle>

              {libraryStatus && (
                <Badge
                  variant={libraryStatus.isOpen === false ? 'destructive' : 'success'}
                  className={`text-xs px-2.5 py-1 font-bold uppercase tracking-wider inline-flex items-center gap-1.5 self-start sm:self-auto ${
                    libraryStatus.isOpen === false ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {libraryStatus.isOpen === false
                      ? 'CLOSED • 09:00 AM - 05:00 PM'
                      : 'OPEN • 09:00 AM - 05:00 PM'}
                  </span>
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {libraryStatus?.isOpen === false && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Library is Currently Closed</p>
                  <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                    CLMS libraries operate strictly between <strong>09:00 AM</strong> and <strong>05:00 PM</strong> (Asia/Kolkata). Entry and exit scanning are disabled while closed. All active visits are automatically marked OUT at 5:00 PM.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#2B232E] dark:text-[#FFF4E9] uppercase tracking-wider mb-1.5">
                  Select Library
                </label>
                <LibrarySelect
                  includeAllOption={false}
                  value={selectedLibrary}
                  onChange={(e) => {
                    setSelectedLibrary(e.target.value);
                    setResult(null);
                    setErrorInfo(null);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="font-semibold"
                />
              </div>

              {libraryStatus && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#E8DBC5]/40 dark:bg-[#2D2534] border border-[#E8DBC5] dark:border-[#3B3142] rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD]">Library Name</span>
                    <p className="text-sm font-extrabold text-[#2B232E] dark:text-[#FFF4E9] truncate mt-0.5">{selectedLibObj?.name || 'Library'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD]">Current Occupancy</span>
                    <p className="text-sm font-extrabold text-[#8D6B94] dark:text-[#B185A7] mt-0.5">{libraryStatus.activeVisits} Visitors</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD]">Available Seats</span>
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{libraryStatus.availableSeats} Free</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD]">Total Capacity</span>
                    <p className="text-sm font-extrabold text-[#2B232E] dark:text-[#FFF4E9] mt-0.5">{libraryStatus.capacity} Seats</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#2B232E] dark:text-[#FFF4E9] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                  USER ID
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder={libraryStatus?.isOpen === false ? 'LIBRARY CLOSED (09:00 AM - 05:00 PM)' : 'ENTER USER ID'}
                    className="h-14 text-lg font-mono uppercase font-bold tracking-wider px-4 border-[#E8DBC5] dark:border-[#3B3142] bg-white dark:bg-[#211C26] text-[#2B232E] dark:text-[#FFF4E9] flex-1 focus:ring-[#8D6B94]"
                    disabled={loading || libraryStatus?.isOpen === false}
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    isLoading={loading}
                    disabled={libraryStatus?.isOpen === false}
                    className="h-14 px-8 bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-base shadow-2xs shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRightCircle className="w-5 h-5 mr-2" />
                    {libraryStatus?.isOpen === false ? 'Library Closed' : 'Enter / Exit'}
                  </Button>
                </div>
              </div>
            </form>


            {errorInfo && (
              <Alert variant="destructive" className="border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 p-4 rounded-xl">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <h4 className="font-extrabold text-sm text-rose-950 dark:text-rose-100 uppercase tracking-wide">
                      {errorInfo.title || 'Check-IN / Check-OUT Rejected'}
                    </h4>
                    {errorInfo.code === 'ALREADY_INSIDE_OTHER_LIBRARY' ? (
                      <div>
                        <p className="text-xs text-rose-900 dark:text-rose-300 font-semibold leading-relaxed">
                          <strong className="font-mono text-rose-950 dark:text-rose-100">{errorInfo.userId || errorInfo.rollNumber}</strong> is currently checked in at{' '}
                          <strong className="font-bold text-rose-950 dark:text-rose-100">{errorInfo.activeLibraryName || 'another library'}</strong>.
                        </p>
                        <p className="text-xs text-rose-700 dark:text-rose-400 font-medium mt-1">
                          Please check out from <strong className="font-bold text-rose-900 dark:text-rose-200">{errorInfo.activeLibraryName || 'the current library'}</strong> before entering{' '}
                          <strong className="font-bold text-rose-900 dark:text-rose-200">{selectedLibObj?.name || 'this library'}</strong>.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold leading-relaxed">{errorInfo.message}</p>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            {result && (
              <div
                className="p-5 rounded-xl border-2 transition-all border-[#8D6B94] bg-[#E8DBC5]/60 dark:bg-[#2D2534] text-[#2B232E] dark:text-[#FFF4E9]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div
                      className="p-3 rounded-xl text-white shadow-2xs shrink-0 bg-[#8D6B94]"
                    >
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className="text-xs font-extrabold px-3 py-0.5 uppercase tracking-wide bg-[#8D6B94] text-white"
                        >
                          {result.action === 'IN' ? 'ENTRY SUCCESSFUL' : 'EXIT SUCCESSFUL'}
                        </Badge>
                        <span className="text-xs font-semibold text-[#7A697E] dark:text-[#B8A6BD]">
                          {new Date(result.checkoutTime || result.checkInTime || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold font-mono tracking-tight mt-1">
                        {(result.user?.id || result.userId || result.rollNumber)} {result.action === 'IN' ? `entered ${result.library?.name || result.libraryName}` : `exited ${result.library?.name || result.libraryName}`}
                      </h3>
                      <div className="text-xs space-y-0.5 pt-1">
                        <p className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
                          User ID: <strong className="font-mono text-[#8D6B94] dark:text-[#B185A7]">{result.user?.id || result.userId || result.rollNumber}</strong>
                        </p>
                        <p className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
                          User Name: <strong className="text-[#8D6B94] dark:text-[#B185A7]">{result.user?.name || result.userName || result.studentName}</strong>
                        </p>
                        <div className="flex items-center space-x-1.5 font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
                          <span>Role:</span>
                          <Badge
                            variant={(result.user?.role || result.userType || result.role) === 'FACULTY' ? 'secondary' : 'outline'}
                            className="font-bold text-[10px] px-2 py-0.5 uppercase tracking-wide"
                          >
                            {result.user?.role || result.userType || result.role || 'STUDENT'}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] font-medium pt-0.5">
                          Status: <strong className="text-[#2B232E] dark:text-[#FFF4E9] uppercase font-bold">{result.status || result.action}</strong> | Library: <strong className="text-[#2B232E] dark:text-[#FFF4E9]">{result.library?.name || result.libraryName}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/90 dark:bg-[#211C26]/90 p-3.5 sm:p-4 rounded-xl border border-[#E8DBC5] dark:border-[#3B3142] shadow-2xs w-full md:w-auto md:min-w-[210px] text-left md:text-right space-y-1">
                    <p className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] tracking-wider">Live Occupancy</p>
                    <p className="text-lg font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">
                      {result.occupancy?.current ?? result.currentOccupancy} / {result.occupancy?.capacity ?? result.capacity}
                    </p>
                    <p className="text-xs font-bold text-[#8D6B94] dark:text-[#B185A7]">
                      {result.occupancy?.available ?? result.availableSeats} Available Seats
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E8DBC5] dark:border-[#3B3142] shadow-sm bg-white dark:bg-[#211C26]">
          <CardHeader className="py-4 border-b border-[#E8DBC5]/60 dark:border-[#3B3142] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
              Recent Gate Logs ({selectedLibObj?.name})
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLibraryData(selectedLibrary)}
              className="text-xs h-8 cursor-pointer"
            >
              Refresh Logs
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E8DBC5]/40 dark:bg-[#2D2534] text-[#8D6B94] dark:text-[#B185A7] uppercase font-bold border-b border-[#E8DBC5] dark:border-[#3B3142]">
                  <tr>
                    <th className="p-3 pl-4">USER ID</th>
                    <th className="p-3">USER NAME</th>
                    <th className="p-3">ROLE</th>
                    <th className="p-3">ACTION</th>
                    <th className="p-3">TIME</th>
                    <th className="p-3 pr-4 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DBC5]/60 dark:divide-[#3B3142]">
                  {recentVisits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[#7A697E] dark:text-[#B8A6BD] font-medium">
                        No recent check-in/check-out logs recorded for this library.
                      </td>
                    </tr>
                  ) : (
                    recentVisits.map((visit) => {
                      const vRole = visit.user?.role || visit.role || visit.userType || 'STUDENT';
                      const vUserId = visit.user?.id || visit.userId || visit.rollNumber;
                      const vUserName = visit.user?.name || visit.userName || visit.studentName || 'User';

                      return (
                        <tr key={visit.id} className="hover:bg-[#FFF4E9]/60 dark:hover:bg-[#2D2534] transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold text-[#2B232E] dark:text-[#FFF4E9]">{vUserId}</td>
                          <td className="p-3 font-semibold text-[#2B232E] dark:text-[#FFF4E9]">{vUserName}</td>
                          <td className="p-3">
                            <Badge
                              variant={vRole === 'FACULTY' ? 'secondary' : 'outline'}
                              className="font-bold text-[10px] px-2 py-0.5 uppercase"
                            >
                              {vRole}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="sand" className="font-bold px-2 py-0.5 uppercase">
                              {visit.action}
                            </Badge>
                          </td>
                          <td className="p-3 text-[#7A697E] dark:text-[#B8A6BD] font-medium">
                            {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-3 pr-4 text-right">
                            {visit.action === 'IN' ? (
                              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                INSIDE
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[#8D6B94] dark:text-[#B185A7] font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                EXITED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};
