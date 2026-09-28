import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { borrowApi } from '../../api/borrowApi';
import { settingsApi } from '../../api/settingsApi';
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
  AlertTriangle,
  Search,
  RefreshCw,
  BookOpen,
  DollarSign,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { formatRollNumber } from '../../lib/utils';

export const OverdueBooksDialog = ({
  isOpen,
  onClose,
  libraryName = 'Assigned Library',
  assignedLibraryId = null,
}) => {
  const navigate = useNavigate();
  const [overdues, setOverdues] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOverdueLoans = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const [overdueRes, setRes] = await Promise.allSettled([
        borrowApi.getOverdue(),
        settingsApi.getSettings(),
      ]);
      if (overdueRes.status === 'fulfilled') {
        const list = overdueRes.value?.data?.data || overdueRes.value?.data || [];
        setOverdues(Array.isArray(list) ? list : []);
      }
      if (setRes.status === 'fulfilled') {
        const sData = setRes.value?.data?.data || setRes.value?.data;
        if (sData) setSettings(sData);
      }
    } catch (err) {
      console.error('Failed to load overdue books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOverdueLoans();
    }
  }, [isOpen]);

  const totalFineAccrued = overdues.reduce((sum, item) => sum + (Number(item.fineAmount) || 0), 0);

  const filteredOverdues = overdues.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const roll = (item.student?.rollNumber || item.rollNumber || '').toLowerCase();
    const name = (item.student?.name || item.borrowerName || '').toLowerCase();
    const title = (item.book?.title || item.bookTitle || '').toLowerCase();
    const barcode = (item.barcode || '').toLowerCase();
    return roll.includes(q) || name.includes(q) || title.includes(q) || barcode.includes(q);
  });

  const handleReturnAction = (item) => {
    const roll = item.student?.rollNumber || item.rollNumber || '';
    const barcode = item.barcode || '';
    onClose();
    navigate(`/librarian/return?rollNumber=${encodeURIComponent(roll)}&bookId=${encodeURIComponent(barcode)}`);
  };

  const handleFineAction = (item) => {
    const roll = item.student?.rollNumber || item.rollNumber || '';
    onClose();
    navigate(`/librarian/fines?rollNumber=${encodeURIComponent(roll)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[94vw] p-5 sm:p-6 bg-white dark:bg-[#1E1823] border-[#E8DBC5] dark:border-[#3B3142] max-h-[88vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-[#E8DBC5]/60 dark:border-[#3B3142] pb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">
                  Overdue Books & Recovery Details
                </DialogTitle>
                <DialogDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
                  Overdue book loans past the 14-day lending threshold requiring recovery • {libraryName}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center pr-6 sm:pr-8">
              <Badge variant="rose" className="text-xs font-bold px-2.5 py-1">
                {overdues.length} Overdue
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOverdueLoans}
                disabled={loading}
                className="h-8 px-2.5 text-xs gap-1 border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer"
                title="Refresh overdue list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 gap-3 py-3 shrink-0">
          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Total Overdue Volumes
            </p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
              {overdues.length}
            </p>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/70">
              Active student accounts flagged for overdue clearance
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Total Accrued Fines
            </p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
              ₹{totalFineAccrued}
            </p>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70">
              Calculated automatically based on elapsed loan days
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative py-1 shrink-0">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#8D6B94]" />
          <Input
            type="text"
            placeholder="Search overdue records by Student Roll Number, Name, Title, or Barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-[#E8DBC5] dark:border-[#3B3142]"
          />
        </div>

        {/* Table of Overdue Loans */}
        <div className="flex-1 overflow-y-auto min-h-[220px] rounded-xl border border-[#E8DBC5] dark:border-[#3B3142] mt-2">
          {loading && overdues.length === 0 ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : filteredOverdues.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                {searchQuery ? 'No matching overdue books found' : 'Zero Overdue Books!'}
              </p>
              <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1 max-w-sm">
                {searchQuery
                  ? 'Try searching with a different roll number or book title.'
                  : 'All issued books in your assigned library are currently returned or within their active lending window.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title & Barcode</TableHead>
                  <TableHead>Borrower Details</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Overdue Age</TableHead>
                  <TableHead>Estimated Fine</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOverdues.map((item) => {
                  const title = item.book?.title || item.bookTitle || 'Unknown Book';
                  const author = item.book?.author || '';
                  const barcode = item.barcode || 'N/A';
                  const roll = item.student?.rollNumber || item.rollNumber || 'N/A';
                  const name = item.student?.name || item.borrowerName || 'Student';
                  const dept = item.student?.department || '';
                  const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';
                  const overdueDays = item.overdueDays || 1;
                  const fineRate = Number(settings?.fineRatePerOverdueDay ?? settings?.finePerDay ?? 1);
                  const fine = item.fineAmount ?? (overdueDays * fineRate);

                  return (
                    <TableRow key={item.transactionId || `${roll}-${barcode}`}>
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
                        <div>
                          <p className="font-semibold text-xs text-[#2B232E] dark:text-[#FFF4E9]">
                            {name}
                          </p>
                          <p className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] font-mono">
                            {formatRollNumber(roll)} {dept ? `• ${dept}` : ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD] whitespace-nowrap">
                        {dueDate}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="rose" className="text-[10px] px-2 py-0.5 font-bold">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {overdueDays}d overdue
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <strong className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          ₹{fine}
                        </strong>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturnAction(item)}
                          className="h-7 px-2.5 text-xs gap-1 border-[#8D6B94]/40 text-[#8D6B94] dark:text-[#B185A7] hover:bg-[#8D6B94]/10 cursor-pointer"
                          title="Process Return"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFineAction(item)}
                          className="h-7 px-2.5 text-xs gap-1 border-amber-400/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                          title="Process Fine Clearance"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Fine</span>
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
            Showing <strong className="text-[#2B232E] dark:text-[#FFF4E9]">{filteredOverdues.length}</strong> of{' '}
            <strong>{overdues.length}</strong> overdue books
          </p>
          <div className="flex items-center space-x-2">
            <Link to="/librarian/fines">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5 text-[#8D6B94]" />
                <span>Fine Clearance Desk</span>
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
