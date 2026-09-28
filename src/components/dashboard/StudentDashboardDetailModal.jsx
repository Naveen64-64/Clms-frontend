import React, { useState, useMemo } from 'react';
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
import { EmptyState } from '../common/EmptyState';
import {
  BookOpen,
  AlertTriangle,
  DollarSign,
  BookMarked,
  Search,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Building2,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';
import { formatRollNumber } from '../../lib/utils';

export const StudentDashboardDetailModal = ({
  isOpen,
  onClose,
  initialTab = 'ACTIVE', // 'ACTIVE' | 'OVERDUE' | 'FINES' | 'HISTORY'
  activeLoans = [],
  overdueLoans = [],
  fines = [],
  history = [],
  studentProfile = null,
  settings = null,
}) => {
  const fineRate = Number(settings?.fineRatePerOverdueDay ?? settings?.finePerDay ?? 1);
  const loanDaysThreshold = Number(settings?.standardLoanDurationDays ?? settings?.defaultLoanDays ?? 14);
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL'); // 'ALL' | 'RETURNED' | 'BORROWED' | 'OVERDUE'
  const [finesFilter, setFinesFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID'

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setCurrentTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  const pendingFines = useMemo(() => {
    return fines.filter((f) => f.status === 'PENDING');
  }, [fines]);

  const pendingFinesTotal = useMemo(() => {
    return pendingFines.reduce((sum, f) => {
      const remaining = f.outstandingAmount !== undefined ? f.outstandingAmount : (f.amount - (f.paidAmount || 0));
      return sum + Math.max(0, remaining);
    }, 0);
  }, [pendingFines]);

  // Days remaining / overdue helper
  const getLoanTiming = (dueDate) => {
    if (!dueDate) return { days: 0, text: 'N/A', isOverdue: false, isUrgent: false };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        days: overdueDays,
        text: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
        isOverdue: true,
        isUrgent: true,
      };
    }
    if (diffDays === 0) {
      return { days: 0, text: 'Due today', isOverdue: false, isUrgent: true };
    }
    if (diffDays === 1) {
      return { days: 1, text: 'Due tomorrow', isOverdue: false, isUrgent: true };
    }
    return {
      days: diffDays,
      text: `${diffDays} days remaining`,
      isOverdue: false,
      isUrgent: diffDays <= 3,
    };
  };

  // Filtered lists based on search
  const filteredActiveLoans = useMemo(() => {
    if (!searchQuery.trim()) return activeLoans;
    const q = searchQuery.toLowerCase().trim();
    return activeLoans.filter((item) => {
      const title = (item.bookCopy?.book?.title || item.book?.title || '').toLowerCase();
      const author = (item.bookCopy?.book?.author || item.book?.author || '').toLowerCase();
      const barcode = (item.bookCopy?.barcode || item.barcode || '').toLowerCase();
      const library = (item.library?.name || '').toLowerCase();
      return title.includes(q) || author.includes(q) || barcode.includes(q) || library.includes(q);
    });
  }, [activeLoans, searchQuery]);

  const filteredOverdueLoans = useMemo(() => {
    if (!searchQuery.trim()) return overdueLoans;
    const q = searchQuery.toLowerCase().trim();
    return overdueLoans.filter((item) => {
      const title = (item.bookCopy?.book?.title || item.book?.title || '').toLowerCase();
      const author = (item.bookCopy?.book?.author || item.book?.author || '').toLowerCase();
      const barcode = (item.bookCopy?.barcode || item.barcode || '').toLowerCase();
      const library = (item.library?.name || '').toLowerCase();
      return title.includes(q) || author.includes(q) || barcode.includes(q) || library.includes(q);
    });
  }, [overdueLoans, searchQuery]);

  const filteredFines = useMemo(() => {
    let list = fines;
    if (finesFilter === 'PENDING') {
      list = list.filter((f) => f.status === 'PENDING');
    } else if (finesFilter === 'PAID') {
      list = list.filter((f) => f.status === 'PAID');
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((f) => {
      const title = (f.borrowTransaction?.bookCopy?.book?.title || '').toLowerCase();
      const barcode = (f.borrowTransaction?.bookCopy?.barcode || '').toLowerCase();
      const reason = (f.reason || '').toLowerCase();
      const status = (f.status || '').toLowerCase();
      return title.includes(q) || barcode.includes(q) || reason.includes(q) || status.includes(q);
    });
  }, [fines, finesFilter, searchQuery]);

  const filteredHistory = useMemo(() => {
    let list = history;
    if (historyStatusFilter !== 'ALL') {
      list = list.filter((item) => item.status === historyStatusFilter);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const title = (item.bookCopy?.book?.title || item.book?.title || '').toLowerCase();
      const author = (item.bookCopy?.book?.author || item.book?.author || '').toLowerCase();
      const barcode = (item.bookCopy?.barcode || item.barcode || '').toLowerCase();
      const library = (item.library?.name || '').toLowerCase();
      const callNo = (item.callNo || '').toLowerCase();
      return title.includes(q) || author.includes(q) || barcode.includes(q) || library.includes(q) || callNo.includes(q);
    });
  }, [history, historyStatusFilter, searchQuery]);

  const tabConfig = {
    ACTIVE: {
      title: 'Active Borrowings',
      description: 'Currently issued physical books in your possession',
      icon: BookOpen,
      iconColor: 'text-[#8D6B94] bg-[#8D6B94]/15',
    },
    OVERDUE: {
      title: 'Overdue Books',
      description: `Borrowed books past their ${loanDaysThreshold}-day circulation threshold`,
      icon: AlertTriangle,
      iconColor: 'text-rose-600 bg-rose-500/15',
    },
    FINES: {
      title: 'Pending & Cleared Fines',
      description: 'Official ledger of library penalties, partial payments, and clearance records',
      icon: DollarSign,
      iconColor: 'text-amber-600 bg-amber-500/15',
    },
    HISTORY: {
      title: 'Borrowing History',
      description: 'Complete chronological history of all your library transactions',
      icon: BookMarked,
      iconColor: 'text-[#8D6B94] bg-[#8D6B94]/15',
    },
  };

  const activeTabMeta = tabConfig[currentTab] || tabConfig.ACTIVE;
  const ActiveIcon = activeTabMeta.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-4 sm:p-6 bg-white dark:bg-[#1E1823] border-[#E8DBC5] dark:border-[#3B3142] max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-[#E8DBC5]/60 dark:border-[#3B3142] pb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${activeTabMeta.iconColor}`}>
                <ActiveIcon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">
                  {activeTabMeta.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
                  {activeTabMeta.description}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2 self-start sm:self-center pr-6 sm:pr-8">
              {currentTab === 'ACTIVE' && (
                <Badge variant="normal" className="text-xs font-bold px-2.5 py-1">
                  {activeLoans.length} Active {activeLoans.length === 1 ? 'Book' : 'Books'}
                </Badge>
              )}
              {currentTab === 'OVERDUE' && (
                <Badge
                  variant={overdueLoans.length > 0 ? 'important' : 'normal'}
                  className="text-xs font-bold px-2.5 py-1"
                >
                  {overdueLoans.length} Overdue
                </Badge>
              )}
              {currentTab === 'FINES' && (
                <Badge
                  variant={pendingFinesTotal > 0 ? 'important' : 'normal'}
                  className="text-xs font-bold px-2.5 py-1"
                >
                  {pendingFinesTotal > 0 ? `₹${pendingFinesTotal} Pending` : 'All Fines Cleared'}
                </Badge>
              )}
              {currentTab === 'HISTORY' && (
                <Badge variant="sand" className="text-xs font-bold px-2.5 py-1">
                  {history.length} Total Loans
                </Badge>
              )}
            </div>
          </div>

          {/* Navigation Tab Bar inside Modal for Instant Context Switching */}
          <div className="flex items-center gap-1.5 pt-3 mt-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setCurrentTab('ACTIVE');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                currentTab === 'ACTIVE'
                  ? 'bg-[#8D6B94] text-white shadow-xs'
                  : 'bg-[#FFF4E9] dark:bg-[#251E27] text-[#7A697E] dark:text-[#B8A6BD] hover:bg-[#E8DBC5]/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Active ({activeLoans.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('OVERDUE');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                currentTab === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#FFF4E9] dark:bg-[#251E27] text-[#7A697E] dark:text-[#B8A6BD] hover:bg-[#E8DBC5]/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Overdue ({overdueLoans.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('FINES');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                currentTab === 'FINES'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#FFF4E9] dark:bg-[#251E27] text-[#7A697E] dark:text-[#B8A6BD] hover:bg-[#E8DBC5]/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Fines (₹{pendingFinesTotal})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('HISTORY');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                currentTab === 'HISTORY'
                  ? 'bg-[#8D6B94] text-white shadow-xs'
                  : 'bg-[#FFF4E9] dark:bg-[#251E27] text-[#7A697E] dark:text-[#B8A6BD] hover:bg-[#E8DBC5]/60'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>History ({history.length})</span>
            </button>
          </div>
        </DialogHeader>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8D6B94]" />
            <Input
              type="text"
              placeholder={
                currentTab === 'FINES'
                  ? 'Filter fines by book title, reason, or status...'
                  : 'Search by title, author, barcode, or library...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-[#E8DBC5] dark:border-[#3B3142]"
            />
          </div>

          {/* Contextual Sub-filters */}
          {currentTab === 'HISTORY' && (
            <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-[#E8DBC5]/40 dark:bg-[#2B232E] border border-[#E8DBC5]/60 dark:border-[#3B3142] self-start sm:self-auto shrink-0">
              {['ALL', 'RETURNED', 'BORROWED', 'OVERDUE'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setHistoryStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    historyStatusFilter === status
                      ? 'bg-white dark:bg-[#1E1823] text-[#8D6B94] dark:text-[#B185A7] shadow-xs'
                      : 'text-[#7A697E] dark:text-[#B8A6BD] hover:text-[#2B232E]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          {currentTab === 'FINES' && (
            <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-[#E8DBC5]/40 dark:bg-[#2B232E] border border-[#E8DBC5]/60 dark:border-[#3B3142] self-start sm:self-auto shrink-0">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Cleared', value: 'PAID' },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFinesFilter(f.value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    finesFilter === f.value
                      ? 'bg-white dark:bg-[#1E1823] text-[#8D6B94] dark:text-[#B185A7] shadow-xs'
                      : 'text-[#7A697E] dark:text-[#B8A6BD] hover:text-[#2B232E]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Content Region */}
        <div className="flex-1 overflow-y-auto min-h-[260px] rounded-xl border border-[#E8DBC5] dark:border-[#3B3142]">
          {/* TAB 1: ACTIVE BORROWINGS */}
          {currentTab === 'ACTIVE' && (
            filteredActiveLoans.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#8D6B94]/10 flex items-center justify-center text-[#8D6B94] mb-1">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {searchQuery ? 'No matching active loans found' : 'No Active Borrowings'}
                </h4>
                <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] max-w-sm">
                  {searchQuery
                    ? 'Try searching with different terms.'
                    : 'You currently have no books issued from any campus library. Visit any library circulation desk to borrow titles.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title & Author</TableHead>
                    <TableHead>Book ID / Barcode</TableHead>
                    <TableHead>Library</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status & Time</TableHead>
                    <TableHead className="text-right">Accrued Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveLoans.map((item) => {
                    const title = item.bookCopy?.book?.title || item.book?.title || 'Unknown Title';
                    const author = item.bookCopy?.book?.author || item.book?.author || 'Unknown Author';
                    const barcode = item.bookCopy?.barcode || item.barcode || 'N/A';
                    const callNo = item.callNo || item.bookCopy?.book?.callNo || '';
                    const libraryName = item.library?.name || 'KIET Library';
                    const issueDateStr = item.issueDate ? new Date(item.issueDate).toLocaleDateString() : 'N/A';
                    const dueDateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';
                    const { text: remainingText, isOverdue, isUrgent, days } = getLoanTiming(item.dueDate);
                    const fineAmt = item.fineAmount || item.overdueFine || (isOverdue ? days * fineRate : 0);

                    return (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-semibold text-xs text-[#2B232E] dark:text-[#FFF4E9] truncate" title={title}>
                              {title}
                            </p>
                            <p className="text-[11px] text-[#7A697E] dark:text-[#B8A6BD] truncate">
                              {author}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-[#8D6B94] dark:text-[#B185A7] px-2 py-0.5 rounded-md bg-[#8D6B94]/10 border border-[#8D6B94]/20">
                            {formatRollNumber(barcode)}
                          </span>
                          {callNo && (
                            <span className="block text-[10px] text-[#7A697E] font-mono mt-0.5">
                              {callNo}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                          {libraryName}
                        </TableCell>
                        <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#8D6B94]" />
                            {issueDateStr}
                          </span>
                        </TableCell>
                        <TableCell className={`text-xs whitespace-nowrap font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-[#2B232E] dark:text-[#FFF4E9]'}`}>
                          {dueDateStr}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={isOverdue ? 'important' : isUrgent ? 'warning' : 'normal'}
                            className="text-[10px] px-2 py-0.5 font-bold"
                          >
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {remainingText}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {fineAmt > 0 ? (
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                              ₹{fineAmt}
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              ₹0
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}

          {/* TAB 2: OVERDUE BOOKS */}
          {currentTab === 'OVERDUE' && (
            filteredOverdueLoans.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-1">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {searchQuery ? 'No matching overdue books found' : 'No Overdue Books'}
                </h4>
                <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] max-w-sm">
                  {searchQuery
                    ? 'Try searching with different terms.'
                    : 'All your borrowed books are returned or within their active lending window. Your library account is in good standing!'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title & Author</TableHead>
                    <TableHead>Book ID / Barcode</TableHead>
                    <TableHead>Library</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead className="text-right">Current Overdue Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOverdueLoans.map((item) => {
                    const title = item.bookCopy?.book?.title || item.book?.title || 'Unknown Title';
                    const author = item.bookCopy?.book?.author || item.book?.author || 'Unknown Author';
                    const barcode = item.bookCopy?.barcode || item.barcode || 'N/A';
                    const libraryName = item.library?.name || 'KIET Library';
                    const issueDateStr = item.issueDate ? new Date(item.issueDate).toLocaleDateString() : 'N/A';
                    const dueDateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';
                    const { days } = getLoanTiming(item.dueDate);
                    const fineAmt = item.fineAmount || item.overdueFine || (days * fineRate);

                    return (
                      <TableRow key={item._id} className="bg-rose-50/40 dark:bg-rose-950/20">
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-bold text-xs text-[#2B232E] dark:text-[#FFF4E9] truncate" title={title}>
                              {title}
                            </p>
                            <p className="text-[11px] text-[#7A697E] dark:text-[#B8A6BD] truncate">
                              {author}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800">
                            {formatRollNumber(barcode)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                          {libraryName}
                        </TableCell>
                        <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                          {issueDateStr}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {dueDateStr}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="important" className="text-[10px] px-2 py-0.5 font-bold">
                            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                            {days} days overdue
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                            ₹{fineAmt}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}

          {/* TAB 3: PENDING & CLEARED FINES */}
          {currentTab === 'FINES' && (
            filteredFines.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-1">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {searchQuery ? 'No matching fine records found' : 'No Pending Fines'}
                </h4>
                <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] max-w-sm">
                  {searchQuery
                    ? 'Try searching with different terms or change filters.'
                    : 'Your library account is in good standing with zero outstanding penalties.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Associated Book / Item</TableHead>
                    <TableHead>Fine Reason</TableHead>
                    <TableHead>Date Assessed</TableHead>
                    <TableHead>Total Fine</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Remaining Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((f) => {
                    const title = f.borrowTransaction?.bookCopy?.book?.title || 'Library Fine';
                    const barcode = f.borrowTransaction?.bookCopy?.barcode || 'N/A';
                    const origAmount = f.originalAmount !== undefined ? f.originalAmount : f.amount || 0;
                    const paidAmount = f.paidAmount || 0;
                    const remaining = f.outstandingAmount !== undefined ? f.outstandingAmount : Math.max(0, origAmount - paidAmount);
                    const isPending = f.status === 'PENDING' && remaining > 0;
                    const isPartial = paidAmount > 0 && remaining > 0;

                    return (
                      <TableRow key={f._id} className={isPending ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-semibold text-xs text-[#2B232E] dark:text-[#FFF4E9] truncate" title={title}>
                              {title}
                            </p>
                            <p className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] font-mono mt-0.5">
                              Barcode: {barcode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="sand" className="text-[10px] font-bold uppercase">
                            {f.reason || 'OVERDUE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                          {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold whitespace-nowrap">
                          ₹{origAmount}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          ₹{paidAmount}
                        </TableCell>
                        <TableCell className="text-xs font-bold whitespace-nowrap">
                          <span className={remaining > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400'}>
                            ₹{remaining}
                          </span>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Badge
                            variant={isPending ? 'important' : isPartial ? 'warning' : 'normal'}
                            className="text-[10px] font-bold uppercase"
                          >
                            {isPartial ? 'PARTIAL' : f.status || 'PENDING'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}

          {/* TAB 4: BORROWING HISTORY */}
          {currentTab === 'HISTORY' && (
            filteredHistory.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#8D6B94]/10 flex items-center justify-center text-[#8D6B94] mb-1">
                  <BookMarked className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {searchQuery || historyStatusFilter !== 'ALL'
                    ? 'No matching history records found'
                    : 'No Borrowing History Available'}
                </h4>
                <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] max-w-sm">
                  {searchQuery || historyStatusFilter !== 'ALL'
                    ? 'Try adjusting your search query or filter tabs.'
                    : 'You have not checked out any books yet. Books borrowed from any campus library will appear here dynamically.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title & Author</TableHead>
                    <TableHead>Book ID / Barcode</TableHead>
                    <TableHead>Library</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Return Condition</TableHead>
                    <TableHead>Fine Accrued</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => {
                    const title = item.bookCopy?.book?.title || item.book?.title || 'Unknown Title';
                    const author = item.bookCopy?.book?.author || item.book?.author || '';
                    const barcode = item.bookCopy?.barcode || item.barcode || 'N/A';
                    const libraryName = item.library?.name || 'KIET Library';
                    const issueDateStr = item.issueDate ? new Date(item.issueDate).toLocaleDateString() : 'N/A';
                    const returnDateStr = item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '—';
                    const condition = item.conditionOnReturn || 'GOOD';
                    const fineAmt = item.fineAmount || item.overdueFine || 0;
                    const finePaid = item.finePaid;

                    return (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-semibold text-xs text-[#2B232E] dark:text-[#FFF4E9] truncate" title={title}>
                              {title}
                            </p>
                            <p className="text-[11px] text-[#7A697E] dark:text-[#B8A6BD] truncate">
                              {author}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-[#8D6B94] dark:text-[#B185A7]">
                          {formatRollNumber(barcode)}
                        </TableCell>
                        <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                          {libraryName}
                        </TableCell>
                        <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                          {issueDateStr}
                        </TableCell>
                        <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                          {returnDateStr}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`text-[11px] font-semibold ${condition === 'GOOD' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {condition}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {fineAmt > 0 ? (
                            <span className={finePaid ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold'}>
                              ₹{fineAmt} {finePaid ? '(Paid)' : '(Unpaid)'}
                            </span>
                          ) : (
                            <span className="text-[#7A697E]">₹0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Badge
                            variant={item.status === 'RETURNED' ? 'normal' : item.status === 'OVERDUE' ? 'important' : 'sand'}
                            className="text-[10px] font-bold"
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E8DBC5]/60 dark:border-[#3B3142] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
            {currentTab === 'ACTIVE' && `Showing ${filteredActiveLoans.length} active loans`}
            {currentTab === 'OVERDUE' && `Showing ${filteredOverdueLoans.length} overdue books`}
            {currentTab === 'FINES' && `Showing ${filteredFines.length} fine records • Outstanding: ₹${pendingFinesTotal}`}
            {currentTab === 'HISTORY' && `Showing ${filteredHistory.length} of ${history.length} transactions`}
          </p>
          <div className="flex items-center space-x-2">
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
