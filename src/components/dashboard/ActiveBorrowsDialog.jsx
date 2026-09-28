import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { borrowApi } from '../../api/borrowApi';
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
import {
  ArrowUpRight,
  Search,
  RefreshCw,
  BookOpen,
  Calendar,
  RotateCcw,
  PlusCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { formatRollNumber } from '../../lib/utils';

export const ActiveBorrowsDialog = ({
  isOpen,
  onClose,
  libraryName = 'Assigned Library',
  assignedLibraryId = null,
}) => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL'); // 'ALL' | 'DUE_SOON' | 'NORMAL'

  const fetchActiveLoans = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await borrowApi.getHistory();
      const list = res?.data?.data?.history || res?.data?.data || res?.data || [];
      const activeList = Array.isArray(list)
        ? list.filter((item) => item.status === 'BORROWED')
        : [];
      setLoans(activeList);
    } catch (err) {
      console.error('Failed to load active borrow transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveLoans();
    }
  }, [isOpen]);

  // Calculate days remaining until due date
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return { days: 0, text: 'N/A', isUrgent: false };
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { days: diffDays, text: 'Due today', isUrgent: true };
    if (diffDays === 1) return { days: diffDays, text: 'Due tomorrow', isUrgent: true };
    if (diffDays <= 3) return { days: diffDays, text: `${diffDays} days left`, isUrgent: true };
    return { days: diffDays, text: `${diffDays} days left`, isUrgent: false };
  };

  const filteredLoans = loans.filter((tx) => {
    const { isUrgent } = getDaysRemaining(tx.dueDate);
    if (urgencyFilter === 'DUE_SOON' && !isUrgent) return false;
    if (urgencyFilter === 'NORMAL' && isUrgent) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const roll = (tx.student?.rollNumber || tx.faculty?.facultyId || '').toLowerCase();
    const name = (tx.student?.name || tx.faculty?.name || '').toLowerCase();
    const title = (tx.bookCopy?.book?.title || tx.book?.title || '').toLowerCase();
    const barcode = (tx.bookCopy?.barcode || tx.barcode || '').toLowerCase();
    const callNo = (tx.callNo || tx.masterBook?.callNo || '').toLowerCase();
    return (
      roll.includes(q) ||
      name.includes(q) ||
      title.includes(q) ||
      barcode.includes(q) ||
      callNo.includes(q)
    );
  });

  const dueSoonCount = loans.filter((tx) => getDaysRemaining(tx.dueDate).isUrgent).length;

  const handleReturnAction = (tx) => {
    const roll = tx.student?.rollNumber || tx.faculty?.facultyId || '';
    const bookIdentifier = tx.bookCopy?.barcode || tx.bookCopy?._id || tx.barcode || '';
    onClose();
    navigate(`/librarian/return?rollNumber=${encodeURIComponent(roll)}&bookId=${encodeURIComponent(bookIdentifier)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[94vw] p-5 sm:p-6 bg-white dark:bg-[#1E1823] border-[#E8DBC5] dark:border-[#3B3142] max-h-[88vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-[#E8DBC5]/60 dark:border-[#3B3142] pb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7] shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">
                  Active Borrow Transactions
                </DialogTitle>
                <DialogDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
                  Currently issued physical book copies out on student and faculty loan • {libraryName}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center pr-6 sm:pr-8">
              <Badge variant="rosy" className="text-xs font-bold px-2.5 py-1">
                {loans.length} Books on Loan
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActiveLoans}
                disabled={loading}
                className="h-8 px-2.5 text-xs gap-1 border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer"
                title="Refresh active loans"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8D6B94]" />
            <Input
              type="text"
              placeholder="Search by Title, Roll Number, Student Name, Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-[#E8DBC5] dark:border-[#3B3142]"
            />
          </div>

          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-[#E8DBC5]/40 dark:bg-[#2B232E] border border-[#E8DBC5]/60 dark:border-[#3B3142] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setUrgencyFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                urgencyFilter === 'ALL'
                  ? 'bg-white dark:bg-[#1E1823] text-[#8D6B94] dark:text-[#B185A7] shadow-xs'
                  : 'text-[#7A697E] dark:text-[#B8A6BD] hover:text-[#2B232E]'
              }`}
            >
              All Active ({loans.length})
            </button>
            <button
              type="button"
              onClick={() => setUrgencyFilter('DUE_SOON')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                urgencyFilter === 'DUE_SOON'
                  ? 'bg-white dark:bg-[#1E1823] text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-[#7A697E] dark:text-[#B8A6BD] hover:text-[#2B232E]'
              }`}
            >
              Due Soon ({dueSoonCount})
            </button>
          </div>
        </div>

        {/* Table of Active Loans */}
        <div className="flex-1 overflow-y-auto min-h-[240px] rounded-xl border border-[#E8DBC5] dark:border-[#3B3142]">
          {loading && loans.length === 0 ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#8D6B94]/10 flex items-center justify-center text-[#8D6B94] mb-2">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                {searchQuery || urgencyFilter !== 'ALL'
                  ? 'No matching active loans found'
                  : 'No active borrow transactions right now'}
              </p>
              <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1 max-w-sm">
                {searchQuery || urgencyFilter !== 'ALL'
                  ? 'Try searching with different terms or switch urgency filters.'
                  : 'All issued books have been returned or no loans are currently active in this library.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book & Barcode</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((tx) => {
                  const title = tx.bookCopy?.book?.title || tx.book?.title || 'Unknown Title';
                  const author = tx.bookCopy?.book?.author || tx.book?.author || '';
                  const barcode = tx.bookCopy?.barcode || tx.barcode || 'N/A';
                  const callNo = tx.callNo || tx.bookCopy?.book?.callNo || '';
                  const roll = tx.student?.rollNumber || tx.faculty?.facultyId || 'N/A';
                  const borrowerName = tx.student?.name || tx.faculty?.name || 'Borrower';
                  const dept = tx.student?.department || tx.faculty?.department || '';
                  const issueDate = tx.issueDate ? new Date(tx.issueDate).toLocaleDateString() : 'N/A';
                  const dueDate = tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : 'N/A';
                  const { text: remainingText, isUrgent } = getDaysRemaining(tx.dueDate);

                  return (
                    <TableRow key={tx._id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-semibold text-xs text-[#2B232E] dark:text-[#FFF4E9] truncate" title={title}>
                            {title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] font-mono">
                              Barcode: {barcode}
                            </span>
                            {callNo && (
                              <Badge variant="sand" className="text-[9px] px-1 py-0 font-mono">
                                {callNo}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-[#2B232E] dark:text-[#FFF4E9]">
                            {borrowerName}
                          </p>
                          <p className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] font-mono">
                            {formatRollNumber(roll)} {dept ? `• ${dept}` : ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#8D6B94]" />
                          {issueDate}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold whitespace-nowrap text-[#2B232E] dark:text-[#FFF4E9]">
                        {dueDate}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={isUrgent ? 'warning' : 'sand'}
                          className="text-[10px] px-2 py-0.5 font-bold"
                        >
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {remainingText}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturnAction(tx)}
                          className="h-7 px-2.5 text-xs gap-1 border-[#8D6B94]/40 text-[#8D6B94] dark:text-[#B185A7] hover:bg-[#8D6B94]/10 cursor-pointer"
                          title="Process Return for this book"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
                        </Button>
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
            Showing <strong className="text-[#2B232E] dark:text-[#FFF4E9]">{filteredLoans.length}</strong> of{' '}
            <strong>{loans.length}</strong> active book borrowings
          </p>
          <div className="flex items-center space-x-2">
            <Link to="/librarian/issue">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#8D6B94]" />
                <span>Issue New Book</span>
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
