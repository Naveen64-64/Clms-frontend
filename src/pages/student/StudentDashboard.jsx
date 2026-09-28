import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { borrowApi } from '../../api/borrowApi';
import { studentApi } from '../../api/studentApi';
import { fineApi } from '../../api/fineApi';
import { libraryApi } from '../../api/libraryApi';
import { settingsApi } from '../../api/settingsApi';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { StudentDashboardDetailModal } from '../../components/dashboard/StudentDashboardDetailModal';
import { StudentLibraryInfoModal } from '../../components/dashboard/StudentLibraryInfoModal';
import {
  BookOpen,
  AlertTriangle,
  DollarSign,
  BookMarked,
  GraduationCap,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Sunrise,
  Sun,
  Sunset,
  User,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatRollNumber, getStudentAssignedLibrary } from '../../lib/utils';

// Canonical list of the 3 operational libraries (Mini Library strictly excluded)
const OPERATIONAL_LIBRARIES = [
  { code: 'KIET_MAIN', name: 'KIET Library', capacity: 50, location: 'Main Campus Building A', isWomenOnly: false },
  { code: 'KIET_2', name: 'KIET 2 Library', capacity: 50, location: 'Academic Block B', isWomenOnly: false },
  { code: 'KIET_WOMEN', name: "KIET Women's Library", capacity: 50, location: 'Girls Hostel Complex', isWomenOnly: true },
];

export const StudentDashboard = () => {
  const { user, studentProfile } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(studentProfile);
  const [fines, setFines] = useState([]);
  const [settings, setSettings] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal States
  const [detailModalTab, setDetailModalTab] = useState(null); // 'ACTIVE' | 'OVERDUE' | 'FINES' | 'HISTORY' | null
  const [selectedLibraryForInfo, setSelectedLibraryForInfo] = useState(null);

  // Dynamic Greeting & Time-Based Lucide Icon
  const getGreetingInfo = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'GOOD MORNING', icon: Sunrise };
    }
    if (hour >= 12 && hour < 17) {
      return { text: 'GOOD AFTERNOON', icon: Sun };
    }
    return { text: 'GOOD EVENING', icon: Sunset };
  };

  const greetingInfo = getGreetingInfo();
  const GreetingIcon = greetingInfo.icon;

  // Real Student Display Name & Roll Number
  const displayName = profile?.name || user?.name || (user?.username ? formatRollNumber(user.username) : '');
  const userRollNumber = formatRollNumber(profile?.rollNumber || user?.studentProfile?.rollNumber || user?.username || '');
  const assignedCampus = getStudentAssignedLibrary(profile || user?.studentProfile || userRollNumber);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [histRes, profRes, finesRes, libsRes, setRes] = await Promise.allSettled([
        borrowApi.getHistory(),
        studentApi.getProfile(),
        fineApi.getFineHistory(),
        libraryApi.getLibraryStatus(),
        settingsApi.getSettings(),
      ]);

      if (histRes.status === 'fulfilled' && histRes.value?.data) {
        setHistory(Array.isArray(histRes.value.data) ? histRes.value.data : []);
      }
      if (profRes.status === 'fulfilled' && profRes.value?.data) {
        setProfile(profRes.value.data);
      }
      if (finesRes.status === 'fulfilled' && finesRes.value?.data) {
        setFines(Array.isArray(finesRes.value.data) ? finesRes.value.data : []);
      }
      if (setRes.status === 'fulfilled') {
        const sData = setRes.value?.data?.data || setRes.value?.data;
        if (sData) setSettings(sData);
      }
      if (libsRes.status === 'fulfilled') {
        const list = Array.isArray(libsRes.value?.data)
          ? libsRes.value.data
          : Array.isArray(libsRes.value)
          ? libsRes.value
          : libsRes.value?.data?.data || [];
        if (list.length > 0) setLibraries(list);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    let eventSource = null;
    try {
      eventSource = new EventSource('/api/v1/libraries/occupancy-stream');
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'OCCUPANCY_UPDATE') {
            libraryApi.getLibraryStatus().then((res) => {
              const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.data?.data || [];
              if (list.length > 0) setLibraries(list);
            }).catch(() => {});
          }
        } catch {}
      };
    } catch {}

    const interval = setInterval(() => {
      libraryApi.getLibraryStatus().then((res) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.data?.data || [];
        if (list.length > 0) setLibraries(list);
      }).catch(() => {});
    }, 15000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, []);

  // Filter Active, Overdue, Returned from Real Data
  const activeLoans = useMemo(() => {
    return history.filter((h) => h.status === 'BORROWED' || h.status === 'OVERDUE');
  }, [history]);

  const overdueLoans = useMemo(() => {
    return history.filter((h) => {
      if (h.status === 'OVERDUE') return true;
      if (h.status === 'BORROWED' && h.dueDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(h.dueDate);
        due.setHours(0, 0, 0, 0);
        return now > due;
      }
      return false;
    });
  }, [history]);

  const returnedLoans = useMemo(() => {
    return history.filter((h) => h.status === 'RETURNED');
  }, [history]);

  const pendingFinesTotal = useMemo(() => {
    return fines
      .filter((f) => f.status === 'PENDING')
      .reduce((sum, f) => {
        const remaining = f.outstandingAmount !== undefined ? f.outstandingAmount : (f.amount - (f.paidAmount || 0));
        return sum + Math.max(0, remaining);
      }, 0);
  }, [fines]);

  // Real Dynamic Access Permissions & Account Status
  const studentGender = profile?.gender ? profile.gender.toUpperCase() : '';
  const accessDisplayText = studentGender === 'MALE'
    ? 'Access: KIET & KIET 2'
    : studentGender === 'FEMALE'
    ? 'Access: All 3 Libraries'
    : `Access: ${assignedCampus}`;

  // Real Monthly Borrowing Data Calculation for circulation summary
  const realBorrowingData = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return [];

    const monthMap = {};
    history.forEach((tx) => {
      if (tx.issueDate) {
        const d = new Date(tx.issueDate);
        if (!isNaN(d.getTime())) {
          const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
          if (!monthMap[key]) {
            monthMap[key] = {
              period: key,
              Issued: 0,
              Returned: 0,
              sortDate: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
            };
          }
          monthMap[key].Issued += 1;
        }
      }
      if (tx.returnDate && tx.status === 'RETURNED') {
        const d = new Date(tx.returnDate);
        if (!isNaN(d.getTime())) {
          const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
          if (!monthMap[key]) {
            monthMap[key] = {
              period: key,
              Issued: 0,
              Returned: 0,
              sortDate: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
            };
          }
          monthMap[key].Returned += 1;
        }
      }
    });

    return Object.values(monthMap).sort((a, b) => a.sortDate - b.sortDate);
  }, [history]);

  // Real Recent Activity Timeline
  const recentActivities = useMemo(() => {
    return [
      ...history.map((h) => ({
        id: `hist-${h._id}`,
        title: h.status === 'RETURNED' ? 'Book Returned' : h.status === 'OVERDUE' ? 'Overdue Reminder' : 'Book Borrowed',
        subtitle: `${h.bookCopy?.book?.title || 'Library Book'} (${h.bookCopy?.barcode ? formatRollNumber(h.bookCopy.barcode) : 'Barcode N/A'})`,
        date: h.returnDate ? new Date(h.returnDate).toLocaleDateString() : h.issueDate ? new Date(h.issueDate).toLocaleDateString() : 'Recent',
        rawDate: new Date(h.returnDate || h.issueDate || 0).getTime(),
        status: h.status,
        icon: h.status === 'RETURNED' ? CheckCircle2 : h.status === 'OVERDUE' ? AlertTriangle : BookOpen,
        iconColor: h.status === 'RETURNED' ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50' : h.status === 'OVERDUE' ? 'text-rose-600 bg-rose-100 dark:bg-rose-950/50' : 'text-[#8D6B94] bg-[#8D6B94]/15',
      })),
      ...fines.map((f) => ({
        id: `fine-${f._id}`,
        title: f.status === 'PAID' ? 'Fine Cleared' : 'Fine Assessed',
        subtitle: `₹${f.amount || 0} • ${f.reason || 'Library penalty'}`,
        date: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Recent',
        rawDate: new Date(f.createdAt || 0).getTime(),
        status: f.status,
        icon: DollarSign,
        iconColor: f.status === 'PAID' ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50' : 'text-[#8D6B94] bg-[#8D6B94]/15',
      })),
    ].sort((a, b) => b.rawDate - a.rawDate).slice(0, 5);
  }, [history, fines]);

  // Operational 3 Libraries populated with live seat occupancy data
  const operationalLibrariesData = useMemo(() => {
    return OPERATIONAL_LIBRARIES.map((opLib) => {
      const live = libraries.find((l) => l.code === opLib.code || l.id === opLib.code);
      const active = live?.activeVisits ?? live?.currentOccupancy ?? 0;
      const capacity = live?.capacity ?? opLib.capacity;
      const available = Math.max(0, capacity - active);
      const occupancyPct = capacity > 0 ? Math.min(100, Math.round((active / capacity) * 100)) : 0;
      const isOpen = live?.isOpen !== undefined ? live.isOpen : true;

      return {
        ...opLib,
        activeVisits: active,
        capacity,
        availableSeats: available,
        occupancyPct,
        isOpen,
        location: live?.location || opLib.location,
        openingTime: live?.openingTime || '09:00 AM',
        closingTime: live?.closingTime || '05:00 PM',
      };
    });
  }, [libraries]);

  // Chart Styling strictly following KDL Purple + Cream theme
  const gridStroke = isDark ? 'rgba(255, 244, 233, 0.08)' : '#E8DBC5';
  const tickColor = isDark ? '#D1C2D4' : '#7A697E';
  const tooltipBg = isDark ? '#302731' : '#FFFFFF';
  const tooltipBorder = isDark ? 'rgba(255, 244, 233, 0.15)' : '#E8DBC5';
  const tooltipText = isDark ? '#FFF4E9' : '#2B232E';

  return (
    <div className="space-y-8 pb-12">
      {/* 1. WELCOME HERO SECTION */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E8DBC5] dark:border-[#3B3142] shadow-[0_8px_30px_rgba(43,35,46,0.10)] bg-white dark:bg-[#1E1823] transition-all">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100 contrast-[1.18] brightness-[0.88] saturate-[1.15]"
          style={{ backgroundImage: `url('/library_hero_bg.jpg')` }}
        />

        {/* Controlled Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFF4E9]/92 via-[#FFF4E9]/80 to-[#FFF4E9]/35 dark:from-[#1C1721]/94 dark:via-[#1C1721]/82 dark:to-[#1C1721]/35 backdrop-blur-[1px]" />

        {/* Hero Content */}
        <div className="relative z-10 p-5 sm:p-7 lg:p-8 flex flex-col justify-between">
          <div className="space-y-3.5 max-w-2xl">
            {/* Dynamic Time-Based Greeting with Sunrise / Sun / Sunset Icon */}
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-[#8D6B94]/20 text-[#8D6B94] dark:text-[#B185A7] border border-[#8D6B94]/30 shadow-2xs">
                <GreetingIcon className="w-4 h-4" />
              </span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#8D6B94] dark:text-[#B185A7]">
                {greetingInfo.text},
              </span>
            </div>

            {/* Prominent Student Name */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2B232E] dark:text-[#FFF4E9] tracking-tight uppercase leading-tight">
                {displayName || (loading ? 'Loading...' : userRollNumber)}
              </h1>
              <p className="text-xs sm:text-sm text-[#7A697E] dark:text-[#D1C2D4] leading-relaxed mt-1 font-medium max-w-xl">
                Your official academic library portal. Monitor active borrowings, multi-campus access, and institutional clearance.
              </p>
            </div>

            {/* Compact Student Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
              <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-[#251E27]/90 border border-[#E8DBC5] dark:border-[#3B3142] font-mono text-xs flex items-center gap-1.5 shadow-2xs">
                <User className="w-3.5 h-3.5 text-[#8D6B94]" />
                Roll: {userRollNumber}
              </span>

              {profile?.department && (
                <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-[#251E27]/90 border border-[#E8DBC5] dark:border-[#3B3142] flex items-center gap-1.5 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-[#8D6B94]" />
                  Dept: {profile.department}
                </span>
              )}

              {profile?.academicYear && (
                <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-[#251E27]/90 border border-[#E8DBC5] dark:border-[#3B3142] flex items-center gap-1.5 shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-[#8D6B94]" />
                  Year: {profile.academicYear}
                </span>
              )}

              <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-[#251E27]/90 border border-[#E8DBC5] dark:border-[#3B3142] flex items-center gap-1.5 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-[#8D6B94]" />
                Campus: {assignedCampus}
              </span>
            </div>

            {/* Access & Account Status Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-[#251E27]/90 border border-[#E8DBC5] dark:border-[#3B3142] shadow-2xs flex items-center gap-1.5 text-[#2B232E] dark:text-[#FFF4E9]">
                <span className="w-2 h-2 rounded-full bg-[#8D6B94] shrink-0" />
                <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] tracking-wider">Access:</span>
                <span className="font-semibold">{accessDisplayText.replace(/^Access:\s*/i, '')}</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-white/90 dark:bg-[#251E27]/90 border border-[#E8DBC5] dark:border-[#3B3142] shadow-2xs flex items-center gap-1.5">
                {overdueLoans.length === 0 && pendingFinesTotal === 0 ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] tracking-wider">Status:</span>
                <span className={`font-semibold ${overdueLoans.length === 0 && pendingFinesTotal === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {overdueLoans.length === 0 && pendingFinesTotal === 0
                    ? 'Active • Good Standing'
                    : overdueLoans.length > 0
                    ? `Attention: ${overdueLoans.length} Overdue`
                    : `Pending: ₹${pendingFinesTotal} Fine`}
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP 4 INTERACTIVE DASHBOARD METRIC CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: ACTIVE BORROWINGS */}
        <StatCard
          title="Active Borrowings"
          value={loading ? '...' : activeLoans.length}
          icon={BookOpen}
          description="Currently issued books"
          color="lavender"
          onClick={() => setDetailModalTab('ACTIVE')}
          actionHint="View active books"
        />

        {/* CARD 2: OVERDUE BOOKS */}
        <StatCard
          title="Overdue Books"
          value={loading ? '...' : overdueLoans.length}
          icon={AlertTriangle}
          badgeText={overdueLoans.length > 0 ? 'ATTENTION' : 'CLEAN'}
          color={overdueLoans.length > 0 ? 'rosy' : 'lavender'}
          onClick={() => setDetailModalTab('OVERDUE')}
          actionHint="View overdue details"
        />

        {/* CARD 3: PENDING FINES */}
        <StatCard
          title="Pending Fines"
          value={loading ? '...' : `₹${pendingFinesTotal}`}
          icon={DollarSign}
          description={pendingFinesTotal > 0 ? 'Unpaid overdue fines' : 'Zero outstanding penalties'}
          color={pendingFinesTotal > 0 ? 'amethyst' : 'sand'}
          onClick={() => setDetailModalTab('FINES')}
          actionHint="View fine records"
        />

        {/* CARD 4: BORROWING HISTORY */}
        <StatCard
          title="Borrowing History"
          value={loading ? '...' : history.length}
          icon={BookMarked}
          description="Total books checked out"
          color="sand"
          onClick={() => setDetailModalTab('HISTORY')}
          actionHint="View all history"
        />
      </section>

      {/* 3. LIBRARY OCCUPANCY (STATIC, 3 OPERATIONAL LIBRARIES) & BORROWING SUMMARY */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clean Static Library Occupancy Component (Replacing Most Borrowed Categories) */}
        <Card className="border-[#E8DBC5] dark:border-[#3B3142] flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-[#E8DBC5]/60 dark:border-[#3B3142]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#8D6B94]" />
                  <span>Library Occupancy</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
                  Live seat availability across all 3 campus library branches
                </CardDescription>
              </div>
              <Badge variant="normal" className="text-[10px] font-semibold flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync</span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            {operationalLibrariesData.map((lib) => {
              const isWomen = Boolean(lib.isWomenOnly || lib.code === 'KIET_WOMEN');

              return (
                <div
                  key={lib.code}
                  onClick={() => setSelectedLibraryForInfo(lib)}
                  className="p-3.5 rounded-xl bg-[#FFF4E9]/60 dark:bg-[#251E27] border border-[#E8DBC5] dark:border-[#3B3142] hover:border-[#8D6B94]/60 dark:hover:border-[#B185A7]/60 hover:shadow-xs transition-all cursor-pointer group"
                  title="Click to view full library details & operating rules"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-[#2B232E] dark:text-[#FFF4E9] truncate">
                        {lib.name}
                      </span>
                      {isWomen && (
                        <Badge variant="amethyst" className="text-[9px] px-1.5 py-0 font-bold shrink-0">
                          Women's
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant={lib.isOpen ? 'normal' : 'important'}
                      className="text-[9px] px-2 py-0.5 font-bold uppercase shrink-0"
                    >
                      {lib.isOpen ? 'OPEN' : 'CLOSED'}
                    </Badge>
                  </div>

                  {/* 4-Column Clean Metric Grid */}
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs mb-2.5">
                    <div className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1E1823]/90 border border-[#E8DBC5]/60 dark:border-[#3B3142]/60">
                      <span className="text-[9px] text-[#7A697E] dark:text-[#B8A6BD] uppercase font-bold block">Occupied</span>
                      <strong className="text-xs sm:text-sm font-black text-[#8D6B94] dark:text-[#B185A7]">{lib.activeVisits}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1E1823]/90 border border-[#E8DBC5]/60 dark:border-[#3B3142]/60">
                      <span className="text-[9px] text-[#7A697E] dark:text-[#B8A6BD] uppercase font-bold block">Available</span>
                      <strong className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">{lib.availableSeats}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1E1823]/90 border border-[#E8DBC5]/60 dark:border-[#3B3142]/60">
                      <span className="text-[9px] text-[#7A697E] dark:text-[#B8A6BD] uppercase font-bold block">Capacity</span>
                      <strong className="text-xs sm:text-sm font-black text-[#2B232E] dark:text-[#FFF4E9]">{lib.capacity}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1E1823]/90 border border-[#E8DBC5]/60 dark:border-[#3B3142]/60">
                      <span className="text-[9px] text-[#7A697E] dark:text-[#B8A6BD] uppercase font-bold block">Occupancy</span>
                      <strong className="text-xs sm:text-sm font-black text-[#8D6B94] dark:text-[#B185A7]">{lib.occupancyPct}%</strong>
                    </div>
                  </div>

                  {/* Clean Static Progress Bar */}
                  <div className="h-1.5 w-full bg-[#E8DBC5]/80 dark:bg-[#3B3142] rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        lib.occupancyPct > 90 ? 'bg-rose-500' : lib.occupancyPct > 70 ? 'bg-amber-500' : 'bg-[#8D6B94]'
                      }`}
                      style={{ width: `${lib.occupancyPct}%` }}
                    />
                  </div>

                  {/* Bottom Line with Operating Hours and Interactive Details Prompt */}
                  <div className="flex items-center justify-between text-[10px] text-[#7A697E] dark:text-[#B8A6BD] pt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[#8D6B94]" />
                      <span>Timing: 09:00 AM - 05:00 PM</span>
                    </span>
                    <span className="font-semibold text-[#8D6B94] dark:text-[#B185A7] group-hover:underline flex items-center gap-0.5">
                      <span>View Details</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Your Borrowing Summary Card with Recharts */}
        <Card className="border-[#E8DBC5] dark:border-[#3B3142] flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-[#E8DBC5]/60 dark:border-[#3B3142]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  Your Borrowing Summary
                </CardTitle>
                <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
                  Circulation history derived from your actual borrowings
                </CardDescription>
              </div>
              <Badge variant="normal" className="text-xs shrink-0">
                {activeLoans.length} Active
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex-1 flex flex-col justify-between">
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : realBorrowingData.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 rounded-2xl bg-[#8D6B94]/10 text-[#8D6B94] dark:text-[#B185A7]">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">No Borrowing Records Found</h4>
                <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] max-w-sm">
                  You do not have any circulation records yet. Books you issue and return from any campus library will appear here dynamically.
                </p>
              </div>
            ) : (
              <>
                <div className="w-full h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={realBorrowingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          color: tooltipText,
                          borderRadius: '8px',
                          border: `1px solid ${tooltipBorder}`,
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: tickColor }} />
                      <Bar dataKey="Issued" name="Issued Books" fill="#8D6B94" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Returned" name="Returned Books" fill="#C3A29E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Real Metric Counters */}
                <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-[#E8DBC5]/60 dark:border-[#3B3142] text-center">
                  <div>
                    <span className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] uppercase font-bold block">Total Loans</span>
                    <strong className="text-sm font-black text-[#2B232E] dark:text-[#FFF4E9]">{history.length}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] uppercase font-bold block">Returned</span>
                    <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">{returnedLoans.length}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] uppercase font-bold block">Active Outstanding</span>
                    <strong className="text-sm font-black text-[#8D6B94] dark:text-[#B185A7]">{activeLoans.length}</strong>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 4. RECENT ACTIVITY & CURRENTLY ISSUED BOOKS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <Card className="lg:col-span-1 border-[#E8DBC5] dark:border-[#3B3142]">
          <CardHeader className="pb-3 border-b border-[#E8DBC5]/60 dark:border-[#3B3142]">
            <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
              Your recent transactions & notices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {loading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : recentActivities.length === 0 ? (
              <div className="text-xs text-center text-[#7A697E] py-8">No recent transactions recorded.</div>
            ) : (
              recentActivities.map((act) => {
                const IconComponent = act.icon;
                return (
                  <div key={act.id} className="flex items-start space-x-3 text-xs">
                    <div className={`p-2 rounded-xl shrink-0 ${act.iconColor}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#2B232E] dark:text-[#FFF4E9] truncate">{act.title}</p>
                      <p className="text-[#7A697E] dark:text-[#B8A6BD] truncate text-[11px]">{act.subtitle}</p>
                      <span className="text-[10px] text-[#7A697E]/80 font-mono mt-0.5 block">{act.date}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Currently Issued Books Table */}
        <Card className="lg:col-span-2 border-[#E8DBC5] dark:border-[#3B3142]">
          <CardHeader className="pb-3 border-b border-[#E8DBC5]/60 dark:border-[#3B3142] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                Currently Issued Books
              </CardTitle>
              <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
                Live list of books currently in your possession
              </CardDescription>
            </div>
            <Badge variant="normal">{activeLoans.length} Outstanding</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : activeLoans.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Active Loans"
                description="You do not have any borrowed books currently outstanding."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Copy ID</TableHead>
                      <TableHead>Library</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLoans.map((item) => {
                      const isOverdue = item.status === 'OVERDUE' || (item.dueDate && new Date() > new Date(item.dueDate));

                      return (
                        <TableRow key={item._id}>
                          <TableCell className="font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                            {item.bookCopy?.book?.title || 'Book Title'}
                          </TableCell>
                          <TableCell className="font-mono text-xs uppercase">{formatRollNumber(item.bookCopy?.barcode || item.bookCopy?.copyId)}</TableCell>
                          <TableCell>{item.library?.name || 'KIET Library'}</TableCell>
                          <TableCell>{item.issueDate ? new Date(item.issueDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className={isOverdue ? 'text-[#C3A29E] font-bold' : ''}>
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isOverdue ? 'important' : 'normal'}>
                              {isOverdue ? 'OVERDUE' : 'BORROWED'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 5. INTERACTIVE DETAIL MODAL FOR THE 4 STATISTIC CARDS */}
      <StudentDashboardDetailModal
        isOpen={Boolean(detailModalTab)}
        onClose={() => setDetailModalTab(null)}
        initialTab={detailModalTab || 'ACTIVE'}
        activeLoans={activeLoans}
        overdueLoans={overdueLoans}
        fines={fines}
        history={history}
        studentProfile={profile}
        settings={settings}
      />

      {/* 6. INTERACTIVE DETAIL MODAL FOR LIBRARY OCCUPANCY ITEMS */}
      <StudentLibraryInfoModal
        isOpen={Boolean(selectedLibraryForInfo)}
        onClose={() => setSelectedLibraryForInfo(null)}
        library={selectedLibraryForInfo}
        studentGender={profile?.gender}
      />
    </div>
  );
};
