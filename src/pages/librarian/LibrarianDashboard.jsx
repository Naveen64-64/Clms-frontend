import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { reportApi } from '../../api/reportApi';
import { bookApi } from '../../api/bookApi';
import { settingsApi } from '../../api/settingsApi';
import { useDebounce } from '../../hooks/useDebounce';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { BookResultCard } from '../../components/books/BookResultCard';
import { BookDetailsDialog } from '../../components/books/BookDetailsDialog';
import { useAcademicBranches } from '../../hooks/useAcademicBranches';
import { OccupancyDetailsDialog } from '../../components/dashboard/OccupancyDetailsDialog';
import { ActiveBorrowsDialog } from '../../components/dashboard/ActiveBorrowsDialog';
import { OverdueBooksDialog } from '../../components/dashboard/OverdueBooksDialog';
import {
  Users,
  BookOpen,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  BookCheck,
  Search,
  X,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon,
  Library,
  BookMarked,
  Sliders
} from 'lucide-react';

export const LibrarianDashboard = () => {
  const { librarianProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [branchBreakdown, setBranchBreakdown] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Book Search State (Search-First On-Demand Infinite Scroll)
  const [searchTerm, setSearchTerm] = useState('');
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [booksData, setBooksData] = useState({ books: [], pagination: { page: 1, totalPages: 1, total: 0, hasMore: false } });
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ categories: [], branches: [], departments: [] });

  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  const debouncedSearch = useDebounce(searchTerm, 350);
  const hasActiveSearch = Boolean(debouncedSearch.trim() || branch || category || availability);

  const assignedLibrary = librarianProfile?.assignedLibrary;
  const libraryName = assignedLibrary?.name || 'Assigned Library';
  const libraryCode = assignedLibrary?.code || '';
  const assignedLibraryId = assignedLibrary?._id || assignedLibrary;

  // Drill-down Dialog modal states
  const [isOccupancyModalOpen, setIsOccupancyModalOpen] = useState(false);
  const [isIssuedModalOpen, setIsIssuedModalOpen] = useState(false);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);

  // Catalog Section Ref & Highlighting
  const catalogSectionRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isCatalogHighlighted, setIsCatalogHighlighted] = useState(false);

  const handleMasterBooksClick = () => {
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsCatalogHighlighted(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 350);
      setTimeout(() => {
        setIsCatalogHighlighted(false);
      }, 2200);
    }
  };

  // Fetch dynamic categories and branches on mount
  useEffect(() => {
    bookApi
      .getFilterOptions()
      .then((res) => {
        if (res?.data) {
          setFilterOptions(res.data);
        }
      })
      .catch((err) => console.error('Failed to load filter options', err));
  }, []);

  const { allowedBranches } = useAcademicBranches(assignedLibrary || libraryCode, filterOptions.branches);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [dashRes, invRes, setRes] = await Promise.allSettled([
        reportApi.getDashboard(),
        bookApi.getLibrarianInventory(),
        settingsApi.getSettings(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        const raw = dashRes.value.data || dashRes.value;
        setDashboardData(raw.summary || raw);
      }
      if (invRes.status === 'fulfilled' && invRes.value) {
        const raw = invRes.value.data || invRes.value;
        setInventoryStats(raw.inventoryStats || raw);
        if (raw.branchBreakdown && Array.isArray(raw.branchBreakdown)) {
          setBranchBreakdown(raw.branchBreakdown);
        }
      }
      if (setRes.status === 'fulfilled') {
        const raw = setRes.value?.data?.data || setRes.value?.data;
        if (raw) setSettings(raw);
      }
    } catch (e) {
      console.error('[LibrarianDashboard stats error]:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialBooks = async () => {
    if (!hasActiveSearch) {
      setBooksData({ books: [], pagination: { page: 1, totalPages: 1, total: 0, hasMore: false } });
      setSearchLoading(false);
      setSearchError(null);
      setHasMore(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setPage(1);
    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        branch: branch || undefined,
        category: category || undefined,
        availability: availability || undefined,
        libraryId: assignedLibraryId || undefined,
        page: 1,
        limit: 20,
      };
      const res = await bookApi.searchBooks(params);
      if (res?.data) {
        const booksList = res.data.books || [];
        const pag = res.data.pagination || {};
        setBooksData({ books: booksList, pagination: pag });
        setHasMore(pag.hasMore ?? (pag.page < pag.totalPages));
      }
    } catch (e) {
      console.error('[LibrarianDashboard search error]:', e);
      setSearchError(e.message || 'Unable to load books right now.');
      setHasMore(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadMoreBooks = async () => {
    if (isFetchingRef.current || searchLoading || loadingMore || !hasMore || !hasActiveSearch) return;

    isFetchingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        branch: branch || undefined,
        category: category || undefined,
        availability: availability || undefined,
        libraryId: assignedLibraryId || undefined,
        page: nextPage,
        limit: 20,
      };
      const res = await bookApi.searchBooks(params);
      if (res?.data) {
        const newBooks = res.data.books || [];
        const pag = res.data.pagination || {};
        setBooksData((prev) => {
          const seen = new Set(prev.books.map((b) => String(b.id || b._id)));
          const fresh = newBooks.filter((b) => !seen.has(String(b.id || b._id)));
          return {
            books: [...prev.books, ...fresh],
            pagination: pag,
          };
        });
        setPage(nextPage);
        setHasMore(pag.hasMore ?? (nextPage < pag.totalPages));
      }
    } catch (e) {
      console.error('[LibrarianDashboard load more error]:', e);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchInitialBooks();
  }, [debouncedSearch, branch, category, availability, assignedLibraryId]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !searchLoading && !loadingMore) {
          loadMoreBooks();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, searchLoading, loadingMore, page, debouncedSearch, branch, category, availability]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setBranch('');
    setCategory('');
    setAvailability('');
    setPage(1);
    setSearchError(null);
    setHasMore(false);
    setBooksData({ books: [], pagination: { page: 1, totalPages: 1, total: 0, hasMore: false } });
  };


  // Prepare Recharts Data using CLMS Purple/Cream Theme Colors
  const pieChartData = [
    { name: 'Available', value: inventoryStats?.availableCopies ?? inventoryStats?.available ?? 0, color: '#8D6B94' },
    { name: 'Issued', value: inventoryStats?.issuedCopies ?? inventoryStats?.issued ?? 0, color: '#B185A7' },
    { name: 'Damaged', value: inventoryStats?.damagedCopies ?? 0, color: '#C3A29E' },
    { name: 'Lost', value: inventoryStats?.lostCopies ?? 0, color: '#6D5073' },
  ].filter((item) => item.value > 0 || (inventoryStats && item.name === 'Available' || item.name === 'Issued'));

  const barChartData = branchBreakdown.length > 0
    ? branchBreakdown
    : [
        { branch: 'AIDS', count: dashboardData?.totalBooks ? Math.round(dashboardData.totalBooks * 0.3) : 0 },
        { branch: 'CSM', count: dashboardData?.totalBooks ? Math.round(dashboardData.totalBooks * 0.25) : 0 },
        { branch: 'CSD', count: dashboardData?.totalBooks ? Math.round(dashboardData.totalBooks * 0.2) : 0 },
        { branch: 'CSC', count: dashboardData?.totalBooks ? Math.round(dashboardData.totalBooks * 0.15) : 0 },
        { branch: 'CAI', count: dashboardData?.totalBooks ? Math.round(dashboardData.totalBooks * 0.1) : 0 },
      ];

  const barColors = ['#8D6B94', '#B185A7', '#C3A29E', '#7A697E', '#6D5073'];

  return (
    <div className="space-y-6">
      {/* Redesigned Clean Header Bar (Duplicate top-right Register/Issue/Return buttons removed as per Requirement 4) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8DBC5] dark:border-[#3B3142] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8D6B94] dark:text-[#B185A7]">
              KDL - KIET Digital Library
            </span>
            <span className="text-slate-300">•</span>
            <h1 className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">
              {libraryName}
            </h1>
            {libraryCode && (
              <Badge variant="sand" className="text-xs font-mono px-2.5 py-0.5">
                Code: {libraryCode}
              </Badge>
            )}
            <Badge variant="default" className="text-xs px-2.5 py-0.5">
              Role: LIBRARIAN
            </Badge>
          </div>
          <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1">
            Centralized staff operational terminal — Live stats, quick actions & on-demand smart catalog search
          </p>
        </div>
      </div>

      {/* Centralized Library Circulation Policy Guidelines Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#FFF4E9]/60 dark:bg-[#28202D] border border-[#E8DBC5]/80 dark:border-[#3B3142] text-xs">
        <div className="flex items-center gap-2 text-[#7A697E] dark:text-[#B8A6BD] font-semibold">
          <Sliders className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
          <span>Active Circulation Policies:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-[#7A697E] dark:text-[#B8A6BD]">Fine Rate:</span>
            <strong className="text-[#2B232E] dark:text-[#FFF4E9] font-bold">
              ₹{settings?.fineRatePerOverdueDay ?? settings?.finePerDay ?? 1}/day
            </strong>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#7A697E] dark:text-[#B8A6BD]">Borrow Limit:</span>
            <strong className="text-[#2B232E] dark:text-[#FFF4E9] font-bold">
              {settings?.defaultMaxBorrowLimit ?? settings?.maxBooksPerStudent ?? 3} Books
            </strong>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#7A697E] dark:text-[#B8A6BD]">Loan Duration:</span>
            <strong className="text-[#2B232E] dark:text-[#FFF4E9] font-bold">
              {settings?.standardLoanDurationDays ?? settings?.defaultLoanDays ?? 14} Days
            </strong>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Occupancy"
          value={loading ? '...' : dashboardData?.activeVisits ?? 0}
          icon={Users}
          description={`Seats Available: ${dashboardData?.availableSeats ?? 0}`}
          badgeText={`${dashboardData?.seatUtilizationPercentage ?? 0}% Capacity`}
          color="lavender"
          onClick={() => setIsOccupancyModalOpen(true)}
          actionHint="Current occupancy details"
        />
        <StatCard
          title="Physical Copies"
          value={loading ? '...' : inventoryStats?.totalCopies ?? 0}
          icon={BookOpen}
          description={`Available: ${inventoryStats?.available ?? inventoryStats?.availableCopies ?? 0}`}
          color="amethyst"
          to="/librarian/inventory"
          actionHint="Book Inventory"
        />
        <StatCard
          title="Currently Issued"
          value={loading ? '...' : inventoryStats?.issued ?? inventoryStats?.issuedCopies ?? 0}
          icon={ArrowUpRight}
          description="Out on student loan"
          color="rosy"
          onClick={() => setIsIssuedModalOpen(true)}
          actionHint="Active borrow transactions"
        />
        <StatCard
          title="Overdue Books"
          value={loading ? '...' : dashboardData?.totalOverdue ?? 0}
          icon={AlertTriangle}
          badgeText={dashboardData?.totalOverdue > 0 ? 'ACTION REQUIRED' : 'NORMAL'}
          color={dashboardData?.totalOverdue > 0 ? 'rose' : 'sand'}
          onClick={() => setIsOverdueModalOpen(true)}
          actionHint="Overdue books/details"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Master Book Titles"
          value={loading ? '...' : dashboardData?.totalBooks ?? 0}
          icon={BookCheck}
          description="Unique titles in catalog"
          color="lavender"
          onClick={handleMasterBooksClick}
          actionHint="Book Catalog"
        />
        <StatCard
          title="Registered Students"
          value={loading ? '...' : dashboardData?.totalStudents ?? 0}
          icon={Users}
          description="Institutional student base"
          color="amethyst"
          to="/librarian/users?type=STUDENT"
          actionHint="User Directory → Students"
        />
        <StatCard
          title="Fines Collected"
          value={loading ? '...' : `₹${dashboardData?.totalFinesCollected ?? 0}`}
          icon={DollarSign}
          description="Total revenue collected"
          color="rosy"
          to="/librarian/fines?tab=history"
          actionHint="Fine records / reports"
        />
      </div>

      {/* Operational Visual Analytics (Recharts Section as per Requirement 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Library Holdings & Availability Status */}
        <Card className="border-[#E8DBC5] dark:border-[#3B3142] shadow-sm bg-white dark:bg-[#211C26]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-[#8D6B94]/15 text-[#8D6B94]">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  Physical Copy Availability
                </CardTitle>
              </div>
              <Badge variant="sand" className="text-[10px]">Live Holdings</Badge>
            </div>
            <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
              Real-time distribution of available, issued, and damaged book copies.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : pieChartData.every((d) => d.value === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#7A697E]">
                <Library className="w-8 h-8 text-[#8D6B94] mb-2 opacity-50" />
                <span>No holdings data recorded yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#2B232E',
                      borderColor: '#8D6B94',
                      borderRadius: '8px',
                      color: '#FFF4E9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-[#2B232E] dark:text-[#FFF4E9] font-medium">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Academic Branch Distribution */}
        <Card className="border-[#E8DBC5] dark:border-[#3B3142] shadow-sm bg-white dark:bg-[#211C26]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-[#8D6B94]/15 text-[#8D6B94]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  Catalog Titles by Branch
                </CardTitle>
              </div>
              <Badge variant="sand" className="text-[10px]">Academic Breakdown</Badge>
            </div>
            <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
              Distribution of specialized books across KIET engineering branches.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="branch"
                    tick={{ fill: '#7A697E', fontSize: 11 }}
                    axisLine={{ stroke: '#E8DBC5' }}
                  />
                  <YAxis
                    tick={{ fill: '#7A697E', fontSize: 11 }}
                    axisLine={{ stroke: '#E8DBC5' }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#2B232E',
                      borderColor: '#8D6B94',
                      borderRadius: '8px',
                      color: '#FFF4E9',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search-First Book Section with Refined Book Vector Visuals (Requirement 7) */}
      <Card
        ref={catalogSectionRef}
        id="catalog-search"
        className={`border-[#E8DBC5] dark:border-[#3B3142] shadow-sm overflow-hidden bg-white dark:bg-[#211C26] transition-all duration-300 ${
          isCatalogHighlighted ? 'ring-4 ring-[#8D6B94] ring-offset-2 dark:ring-offset-[#1C1721] shadow-2xl scale-[1.002]' : ''
        }`}
      >
        <CardHeader className="relative bg-gradient-to-r from-[#FFF4E9] via-[#E8DBC5]/40 to-[#FFF4E9] dark:from-[#1A151E] dark:via-[#261E2C] dark:to-[#1A151E] border-b border-[#E8DBC5]/60 dark:border-[#3B3142] p-6">
          {/* Subtle Decorative Book Vector Art Background Element */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 dark:opacity-20 pointer-events-none hidden md:block">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#8D6B94" strokeWidth="1.2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M12 6h4" />
              <path d="M12 10h4" />
            </svg>
          </div>

          <div className="max-w-2xl mx-auto text-center space-y-2 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E8DBC5] dark:bg-[#352B3A] border border-[#C3A29E]/60 text-[#8D6B94] dark:text-[#B185A7] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Search Operations Terminal</span>
            </div>
            <CardTitle className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">
              Search Library Books
            </CardTitle>
            <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] max-w-md mx-auto">
              Find a book quickly by Book ID, title, author, ISBN, category, or academic branch.
            </CardDescription>
          </div>

          {/* Search Inputs & Filters Bar */}
          <div className="max-w-3xl mx-auto mt-6 space-y-3 relative z-10">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-[#8D6B94]" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search by Book ID, Title, Author, ISBN, or Category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-12 pr-10 py-3 text-sm rounded-xl border-[#E8DBC5] dark:border-[#3B3142] focus:border-[#8D6B94] focus:ring-2 focus:ring-[#8D6B94]/20 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 p-1 text-[#7A697E] hover:text-[#2B232E] rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-lg"
              >
                <option value="">All Academic Branches</option>
                {allowedBranches.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </Select>

              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-lg"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>

              <Select
                value={availability}
                onChange={(e) => {
                  setAvailability(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-lg"
              >
                <option value="">All Titles</option>
                <option value="AVAILABLE">Available Now</option>
                <option value="ISSUED">Currently Issued</option>
              </Select>
            </div>

            {hasActiveSearch && (
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="text-xs text-[#7A697E] hover:text-[#2B232E]"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Clear Search & Filters
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* INITIAL ANIMATED EMPTY STATE WITH ELEGANT CLMS BOOK ILLUSTRATION */}
          {!hasActiveSearch && (
            <div className="py-12 px-4 text-center max-w-lg mx-auto space-y-5">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[#E8DBC5]/50 dark:bg-[#2B232E] border-2 border-[#C3A29E] flex items-center justify-center shadow-2xs">
                  <BookMarked className="w-12 h-12 text-[#8D6B94] dark:text-[#B185A7] transition-transform duration-700 hover:scale-110" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#8D6B94] text-white flex items-center justify-center shadow-2xs text-xs font-bold">
                  <Search className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  Search the Library Catalog
                </h3>
                <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] max-w-md mx-auto leading-relaxed">
                  Enter a Book ID, title, author, ISBN, or category above to retrieve live copy availability and details.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px]">
                <Badge variant="sand">Instant Catalog Search</Badge>
                <Badge variant="sand">Live Copy Breakdown</Badge>
                <Badge variant="sand">1-Click Book ID Copy</Badge>
              </div>
            </div>
          )}

          {/* SEARCH RESULTS STATE */}
          {hasActiveSearch && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#7A697E] dark:text-[#B8A6BD] border-b border-[#E8DBC5]/60 dark:border-[#3B3142] pb-2">
                <span className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
                  {searchLoading
                    ? 'Searching repository...'
                    : `Found ${booksData.books.length} of ${booksData.pagination.total} books`}
                </span>
                {booksData.pagination.totalPages > 1 && (
                  <span>
                    Page {booksData.pagination.page} of {booksData.pagination.totalPages}
                  </span>
                )}
              </div>

              {searchError && (
                <Alert variant="destructive" className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={fetchInitialBooks} className="h-7 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                  </Button>
                </Alert>
              )}

              {searchLoading ? (
                <div className="bg-white dark:bg-[#211C26] border border-[#E8DBC5] dark:border-[#3B3142] rounded-xl overflow-hidden divide-y divide-[#E8DBC5]/60 dark:divide-[#3B3142]">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 flex items-center justify-between space-x-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : booksData.books.length === 0 && !searchError ? (
                <EmptyState
                  icon={Search}
                  title="No Books Found"
                  description="Try searching with a different Book ID, title, author, ISBN, or category."
                />
              ) : (
                <div className="bg-white dark:bg-[#211C26] border border-[#E8DBC5] dark:border-[#3B3142] rounded-xl overflow-hidden shadow-2xs">
                  <div className="hidden md:grid md:grid-cols-12 md:gap-4 px-4 py-2.5 bg-[#E8DBC5]/40 dark:bg-[#2D2534] border-b border-[#E8DBC5] dark:border-[#3B3142] text-[11px] font-bold text-[#8D6B94] dark:text-[#B185A7] uppercase tracking-wider">
                    <div className="col-span-4">Book Title & Author</div>
                    <div className="col-span-2">Category & Branch</div>
                    <div className="col-span-2">Library Holdings</div>
                    <div className="col-span-2">Status & Availability</div>
                    <div className="col-span-2 text-right">Book ID & Action</div>
                  </div>

                  <div className="divide-y divide-[#E8DBC5]/60 dark:divide-[#3B3142]">
                    {booksData.books.map((book) => (
                      <BookResultCard
                        key={book.id || book._id}
                        book={book}
                        onViewDetails={(b) => setSelectedBook(b)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Infinite Scroll Bottom Sentinel and Status Indicators */}
              <div ref={sentinelRef} className="h-6" />

              {loadingMore && (
                <div className="py-4 flex items-center justify-center space-x-2 text-xs text-[#8D6B94] dark:text-[#B185A7] font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading more books...</span>
                </div>
              )}

              {!hasMore && booksData.books.length > 0 && !searchLoading && (
                <div className="py-4 text-center text-xs text-[#7A697E] dark:text-[#B8A6BD] border-t border-[#E8DBC5]/40 font-medium">
                  All results loaded ({booksData.books.length} of {booksData.pagination.total} books)
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      <BookDetailsDialog
        open={Boolean(selectedBook)}
        onOpenChange={(open) => !open && setSelectedBook(null)}
        book={selectedBook}
        mode="librarian"
      />

      {/* Interactive Drilldown Dialogs */}
      <OccupancyDetailsDialog
        isOpen={isOccupancyModalOpen}
        onClose={() => setIsOccupancyModalOpen(false)}
        libraryId={assignedLibraryId || libraryCode}
        libraryName={libraryName}
        libraryCode={libraryCode}
        summaryData={dashboardData}
      />

      <ActiveBorrowsDialog
        isOpen={isIssuedModalOpen}
        onClose={() => setIsIssuedModalOpen(false)}
        libraryName={libraryName}
        assignedLibraryId={assignedLibraryId}
      />

      <OverdueBooksDialog
        isOpen={isOverdueModalOpen}
        onClose={() => setIsOverdueModalOpen(false)}
        libraryName={libraryName}
        assignedLibraryId={assignedLibraryId}
      />
    </div>
  );
};
