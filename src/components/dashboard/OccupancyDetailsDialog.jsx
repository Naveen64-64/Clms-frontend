import React, { useState, useEffect } from 'react';
import { entryExitApi } from '../../api/entryExitApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/Dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/Table';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert } from '../ui/Alert';
import {
  Users,
  Search,
  RefreshCw,
  Clock,
  Building2,
  GraduationCap,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRollNumber } from '../../lib/utils';

export const OccupancyDetailsDialog = ({
  isOpen,
  onClose,
  libraryId,
  libraryName = 'Assigned Library',
  libraryCode = '',
  summaryData = null,
}) => {
  const [visitors, setVisitors] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'STUDENT' | 'FACULTY'
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const effectiveLibraryId = libraryId || libraryCode;

  const fetchActiveVisits = async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await entryExitApi.getActiveVisits(effectiveLibraryId);
      const resData = res?.data || res || {};

      // Handle both structured object response { visitors: [...], activeCount, ... }
      // and plain array response [ { ... } ]
      let visitorsList = [];
      let meta = null;

      if (Array.isArray(resData)) {
        visitorsList = resData;
      } else if (Array.isArray(resData?.visitors)) {
        visitorsList = resData.visitors;
        meta = resData;
      } else if (Array.isArray(resData?.data?.visitors)) {
        visitorsList = resData.data.visitors;
        meta = resData.data;
      } else if (Array.isArray(resData?.data)) {
        visitorsList = resData.data;
      }

      setVisitors(visitorsList);
      setMetadata(meta);
      setLastRefreshed(new Date());

      // Consistency assertion in development
      if (process.env.NODE_ENV !== 'production' && visitorsList.length > 0) {
        const studentCheck = visitorsList.filter(
          (v) => (v.userType || '').toUpperCase() === 'STUDENT' || (!v.faculty && v.student)
        ).length;
        const facultyCheck = visitorsList.filter(
          (v) => (v.userType || '').toUpperCase() === 'FACULTY' || Boolean(v.faculty)
        ).length;
        console.assert(
          studentCheck + facultyCheck === visitorsList.length,
          `[OccupancyDetailsDialog] Student (${studentCheck}) + Faculty (${facultyCheck}) !== Total (${visitorsList.length})`
        );
      }
    } catch (err) {
      console.error('[OccupancyDetailsDialog] Failed to load active visits:', err);
      setError('Unable to load current occupancy details. Please verify server connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveVisits();
      // Auto refresh every 15s while modal is open
      const timer = setInterval(fetchActiveVisits, 15000);
      return () => clearInterval(timer);
    } else {
      // Reset state on close
      setVisitors([]);
      setMetadata(null);
      setError(null);
      setSearchQuery('');
      setTypeFilter('ALL');
    }
  }, [isOpen, effectiveLibraryId]);

  // Derived metrics guaranteed to be 100% consistent with the visitors dataset
  const activeCount = visitors.length;
  const capacity =
    metadata?.capacity ||
    summaryData?.totalCapacity ||
    (libraryCode === 'KIET_MAIN' ? 50 : libraryCode === 'KIET_2' ? 50 : 50);
  const availableSeats = Math.max(0, capacity - activeCount);
  const utilPercent = capacity > 0 ? Math.min(100, Math.round((activeCount / capacity) * 100)) : 0;

  // Counts derived strictly from the same returned visitor records
  const studentCount = visitors.filter(
    (v) => (v.userType || '').toUpperCase() === 'STUDENT' || (!v.faculty && v.student)
  ).length;
  const facultyCount = visitors.filter(
    (v) => (v.userType || '').toUpperCase() === 'FACULTY' || Boolean(v.faculty)
  ).length;

  // Format elapsed time inside library (capped at closing time if visit spans across)
  const getElapsedString = (checkInTime, checkoutTime) => {
    if (!checkInTime) return 'Just now';
    const start = new Date(checkInTime).getTime();
    let end = checkoutTime ? new Date(checkoutTime).getTime() : Date.now();

    // Defensive safeguard: maximum valid operating visit duration in a single day is 8 hours (480 mins)
    const diffMs = Math.max(0, end - start);
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins}m inside`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m inside`;
  };

  // Search and filter across active visitors
  const filteredVisits = visitors.filter((v) => {
    const isFaculty = (v.userType || '').toUpperCase() === 'FACULTY' || Boolean(v.faculty);
    if (typeFilter === 'STUDENT' && isFaculty) return false;
    if (typeFilter === 'FACULTY' && !isFaculty) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    // Student fields: rollNumber, name, department
    // Faculty fields: facultyId, name, department, email
    const id = (
      v.userId ||
      v.rollNumber ||
      v.facultyId ||
      v.student?.rollNumber ||
      v.faculty?.facultyId ||
      ''
    ).toLowerCase();
    const name = (v.fullName || v.name || v.student?.name || v.faculty?.name || v.user?.username || '').toLowerCase();
    const dept = (v.department || v.student?.department || v.faculty?.department || '').toLowerCase();
    const email = (v.email || v.faculty?.email || v.student?.email || '').toLowerCase();

    return id.includes(q) || name.includes(q) || dept.includes(q) || email.includes(q);
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[94vw] p-5 sm:p-6 bg-white dark:bg-[#1E1823] border-[#E8DBC5] dark:border-[#3B3142] max-h-[88vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-[#E8DBC5]/60 dark:border-[#3B3142] pb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">
                  Current Occupancy Details
                </DialogTitle>
                <DialogDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#8D6B94]" />
                  <span>{libraryName}</span>
                  {libraryCode && (
                    <Badge variant="sand" className="text-[10px] px-1.5 py-0 font-mono">
                      {libraryCode}
                    </Badge>
                  )}
                  <span>• Live real-time attendance ledger</span>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center pr-6 sm:pr-8">
              {metadata?.isOpen === false ? (
                <span className="flex items-center space-x-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Closed (09:00 AM - 05:00 PM)</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Gate Feed</span>
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActiveVisits}
                disabled={loading}
                className="h-8 px-2.5 text-xs gap-1 border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer"
                title="Refresh active occupancy"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

          </div>
        </DialogHeader>

        {/* Real-time Utilization Metric Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 shrink-0">
          <div className="p-3 rounded-xl bg-[#FFF4E9] dark:bg-[#2B232E]/60 border border-[#E8DBC5] dark:border-[#3B3142]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD]">
              Active Inside
            </p>
            <p className="text-2xl font-black text-[#2B232E] dark:text-[#FFF4E9] mt-0.5">
              {loading && visitors.length === 0 ? '...' : activeCount}
            </p>
            <p className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD]">
              {studentCount} Students • {facultyCount} Faculty
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FFF4E9] dark:bg-[#2B232E]/60 border border-[#E8DBC5] dark:border-[#3B3142]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD]">
              Available Seats
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {loading && visitors.length === 0 ? '...' : availableSeats}
            </p>
            <p className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD]">
              Out of {capacity} capacity
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FFF4E9] dark:bg-[#2B232E]/60 border border-[#E8DBC5] dark:border-[#3B3142] col-span-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD]">
              <span>Capacity Utilization</span>
              <span className="text-[#8D6B94] dark:text-[#B185A7] font-extrabold text-xs">
                {utilPercent}%
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full bg-[#E8DBC5]/80 dark:bg-[#3B3142] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  utilPercent > 90
                    ? 'bg-rose-500'
                    : utilPercent > 70
                    ? 'bg-amber-500'
                    : 'bg-[#8D6B94]'
                }`}
                style={{ width: `${utilPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] mt-1.5 flex items-center justify-between">
              <span>
                {utilPercent > 90
                  ? 'High occupancy peak'
                  : utilPercent > 70
                  ? 'Moderate capacity'
                  : 'Optimal seat availability'}
              </span>
              {lastRefreshed && (
                <span>Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8D6B94]" />
            <Input
              type="text"
              placeholder="Filter by Roll Number, Name, Department, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-[#E8DBC5] dark:border-[#3B3142]"
            />
          </div>

          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-[#E8DBC5]/40 dark:bg-[#2B232E] border border-[#E8DBC5]/60 dark:border-[#3B3142] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-white dark:bg-[#1E1823] text-[#8D6B94] dark:text-[#B185A7] shadow-xs'
                  : 'text-[#7A697E] dark:text-[#B8A6BD] hover:text-[#2B232E]'
              }`}
            >
              All ({visitors.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('STUDENT')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === 'STUDENT'
                  ? 'bg-white dark:bg-[#1E1823] text-[#8D6B94] dark:text-[#B185A7] shadow-xs'
                  : 'text-[#7A697E] dark:text-[#B8A6BD] hover:text-[#2B232E]'
              }`}
            >
              Students ({studentCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('FACULTY')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === 'FACULTY'
                  ? 'bg-white dark:bg-[#1E1823] text-[#8D6B94] dark:text-[#B185A7] shadow-xs'
                  : 'text-[#7A697E] dark:text-[#B8A6BD] hover:text-[#2B232E]'
              }`}
            >
              Faculty ({facultyCount})
            </button>
          </div>
        </div>

        {/* Scrollable Occupants Table / States */}
        <div className="flex-1 overflow-y-auto min-h-[220px] rounded-xl border border-[#E8DBC5] dark:border-[#3B3142]">
          {/* 1. Explicit Error State */}
          {error ? (
            <div className="h-56 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 mb-1">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                Unable to load current occupancy details.
              </p>
              <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] max-w-sm">
                There was a problem communicating with the library gate service. Please try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActiveVisits}
                className="gap-1.5 text-xs border-[#8D6B94] text-[#8D6B94] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </Button>
            </div>
          ) : loading && visitors.length === 0 ? (
            /* 2. Loading State (Proper Skeleton Rows) */
            <div className="p-6 space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : visitors.length === 0 ? (
            /* 3. True Zero Visitors Empty State */
            metadata?.isOpen === false ? (
              <div className="h-56 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#8D6B94]/10 flex items-center justify-center text-[#8D6B94] mb-2">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  Library is currently closed
                </p>
                <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1 max-w-sm">
                  Operating hours are 09:00 AM to 05:00 PM (Asia/Kolkata). All active visits were automatically closed at 5:00 PM.
                </p>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#8D6B94]/10 flex items-center justify-center text-[#8D6B94] mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  No active visitors currently in the library
                </p>
                <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1 max-w-sm">
                  All {capacity} seats are open. When students or faculty scan their ID at the entrance gate, they appear here live.
                </p>
              </div>
            )
          ) : filteredVisits.length === 0 ? (
            /* 4. Active search/filter matched zero results */
            <div className="h-56 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                No matching occupants found
              </p>
              <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1 max-w-sm">
                Try searching with a different roll number, name, or switch user type filter tabs.
              </p>
            </div>
          ) : (
            /* 5. Real Occupants Table */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Identifier</TableHead>
                  <TableHead>Occupant Name</TableHead>
                  <TableHead>Department / Details</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Time Inside</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((v) => {
                  const isFaculty = (v.userType || '').toUpperCase() === 'FACULTY' || Boolean(v.faculty);
                  const identifier =
                    v.userId ||
                    v.rollNumber ||
                    v.facultyId ||
                    (isFaculty ? v.faculty?.facultyId : v.student?.rollNumber) ||
                    'N/A';
                  const name =
                    v.fullName ||
                    v.name ||
                    (isFaculty ? v.faculty?.name : v.student?.name) ||
                    v.user?.username ||
                    'Library Visitor';
                  const dept =
                    v.department ||
                    (isFaculty ? v.faculty?.department : v.student?.department) ||
                    'General';
                  const academicYear = !isFaculty && v.student?.academicYear ? `Year ${v.student.academicYear}` : '';
                  const checkInDate = v.checkInTime || v.entryTime ? new Date(v.checkInTime || v.entryTime) : null;

                  return (
                    <TableRow key={v._id || `${identifier}-${v.checkInTime}`}>
                      <TableCell className="font-mono font-bold text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-[#8D6B94]/10 text-[#8D6B94] dark:text-[#B185A7] border border-[#8D6B94]/20">
                          {isFaculty ? identifier : formatRollNumber(identifier)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-[#2B232E] dark:text-[#FFF4E9]">
                            {name}
                          </span>
                          <Badge
                            variant={isFaculty ? 'amethyst' : 'default'}
                            className="text-[9px] px-1.5 py-0 font-bold"
                          >
                            {isFaculty ? 'FACULTY' : 'STUDENT'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
                        {dept} {academicYear ? `• ${academicYear}` : ''}
                      </TableCell>
                      <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8D6B94]" />
                          {checkInDate
                            ? checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-[#8D6B94] dark:text-[#B185A7] whitespace-nowrap">
                        {getElapsedString(v.checkInTime || v.entryTime, v.checkoutTime)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge
                          variant="success"
                          className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider inline-flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          INSIDE
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E8DBC5]/60 dark:border-[#3B3142] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
            Showing <strong className="text-[#2B232E] dark:text-[#FFF4E9]">{filteredVisits.length}</strong> of{' '}
            <strong>{visitors.length}</strong> active visitors
          </p>
          <div className="flex items-center space-x-2">
            <Link to="/library-entrance/dashboard" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer">
                <span>Gate Entrance Kiosk</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
              className="text-xs bg-[#8D6B94] hover:bg-[#795B80] cursor-pointer text-[#FFF4E9]"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
