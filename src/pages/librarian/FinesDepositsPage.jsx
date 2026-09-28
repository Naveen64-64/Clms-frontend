import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { fineApi } from '../../api/fineApi';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Search, DollarSign, CheckCircle2, AlertTriangle, User, BookOpen, Clock, ShieldAlert, FileText } from 'lucide-react';
import { formatRollNumber } from '../../lib/utils';

export const FinesDepositsPage = () => {
  const location = useLocation();
  // Search State
  const [searchRollNumber, setSearchRollNumber] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Fine Payment Form State
  const [selectedFineId, setSelectedFineId] = useState('');
  const [payAmountInput, setPayAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payValidationMsg, setPayValidationMsg] = useState('');

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // History Tab State
  const [finesHistory, setFinesHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilterRoll, setHistoryFilterRoll] = useState('');
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'history' ? 'history' : 'pay';
  });

  const fetchStudentFinesByRoll = async (targetRoll) => {
    if (!targetRoll) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    setSelectedFineId('');
    setPayAmountInput('');
    setPayValidationMsg('');
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fineApi.getStudentFines(targetRoll.trim().toUpperCase());
      if (res?.data) {
        setSearchResult(res.data);
        const pendingList = res.data.fines.filter((f) => f.status === 'PENDING');
        if (pendingList.length > 0) {
          setSelectedFineId(pendingList[0]._id);
          setPayAmountInput(String(pendingList[0].outstandingAmount));
        }
      }
    } catch (err) {
      setSearchResult(null);
      setSearchError(err.message || 'Failed to search student fine details');
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchRoll = params.get('rollNumber');
    if (searchRoll) {
      setSearchRollNumber(searchRoll.toUpperCase());
      fetchStudentFinesByRoll(searchRoll.toUpperCase());
    }
    const tabParam = params.get('tab');
    if (tabParam === 'history') {
      setActiveTab('history');
      fetchHistory();
    }
  }, [location.search]);

  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    if (!searchRollNumber.trim()) {
      setSearchError('Please enter a valid Student Roll Number');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    setSelectedFineId('');
    setPayAmountInput('');
    setPayValidationMsg('');
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fineApi.getStudentFines(searchRollNumber.trim().toUpperCase());
      if (res?.data) {
        setSearchResult(res.data);
        const pendingList = res.data.fines.filter((f) => f.status === 'PENDING');
        if (pendingList.length > 0) {
          setSelectedFineId(pendingList[0]._id);
          setPayAmountInput(String(pendingList[0].outstandingAmount));
        }
      }
    } catch (err) {
      setSearchResult(null);
      setSearchError(err.message || 'Failed to search student fine details');
    } finally {
      setSearchLoading(false);
    }
  };

  const selectedFine = searchResult?.fines?.find((f) => f._id === selectedFineId);

  useEffect(() => {
    if (selectedFine) {
      setPayAmountInput(String(selectedFine.outstandingAmount));
      setPayValidationMsg('');
    }
  }, [selectedFineId]);

  const handleAmountChange = (val) => {
    setPayAmountInput(val);
    setPayValidationMsg('');
    if (!selectedFine) return;

    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setPayValidationMsg('Payment amount must be greater than zero.');
    } else if (num > selectedFine.outstandingAmount) {
      setPayValidationMsg(`Payment amount cannot exceed the outstanding fine (₹${selectedFine.outstandingAmount}).`);
    }
  };

  const openConfirmation = (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!selectedFine) {
      setActionError('Please select a pending fine transaction to record payment against.');
      return;
    }

    const num = Number(payAmountInput);
    if (isNaN(num) || num <= 0) {
      setPayValidationMsg('Payment amount must be greater than zero.');
      return;
    }
    if (num > selectedFine.outstandingAmount) {
      setPayValidationMsg(`Payment amount cannot exceed the outstanding fine (₹${selectedFine.outstandingAmount}).`);
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmPaySubmit = async () => {
    if (!selectedFine) return;

    const num = Number(payAmountInput);
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fineApi.payFine({
        fineTransactionId: selectedFine._id,
        rollNumber: searchResult.student.rollNumber,
        amount: num,
        paymentMethod
      });

      if (res?.data) {
        setIsConfirmOpen(false);
        setActionSuccess(res.data);
        // Refresh search results for updated balance
        const refreshRes = await fineApi.getStudentFines(searchResult.student.rollNumber);
        if (refreshRes?.data) {
          setSearchResult(refreshRes.data);
          const remainingPending = refreshRes.data.fines.filter((f) => f.status === 'PENDING');
          if (remainingPending.length > 0) {
            setSelectedFineId(remainingPending[0]._id);
            setPayAmountInput(String(remainingPending[0].outstandingAmount));
          } else {
            setSelectedFineId('');
            setPayAmountInput('');
          }
        }
      }
    } catch (err) {
      setActionError(err.message || 'Payment recording failed');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fineApi.getFineHistory({ rollNumber: historyFilterRoll.trim() || undefined });
      if (res?.data) setFinesHistory(res.data);
    } catch (e) {
      // Ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Fine Clearance & Records Terminal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Server-side Roll Number search, fine settlement, payment receipts, and collection ledger
          </p>
        </div>
        <Link to="/librarian/reports">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer">
            <FileText className="w-3.5 h-3.5 text-[#8D6B94]" />
            <span>Financial Analytics Reports</span>
          </Button>
        </Link>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          if (val === 'history') fetchHistory();
        }}
      >
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="pay">Process Fine Clearance</TabsTrigger>
          <TabsTrigger value="history">Fine Transaction History</TabsTrigger>
        </TabsList>

        {/* Process Payment Tab */}
        <TabsContent value="pay" className="mt-4 space-y-6">
          {/* Roll Number Search Bar */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 py-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Student Roll Number Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Enter Student Roll Number (e.g. 210001)..."
                    value={searchRollNumber}
                    onChange={(e) => setSearchRollNumber(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={searchLoading}
                  className="h-11 px-6 bg-[#8D6B94] hover:bg-[#795B80] font-bold text-sm cursor-pointer shrink-0"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Fine
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search Error Alert */}
          {searchError && (
            <Alert variant="destructive">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Search Failed</span>
              </div>
              <p className="text-xs">{searchError}</p>
            </Alert>
          )}

          {/* Action Success Alert */}
          {actionSuccess && (
            <Alert
              variant={actionSuccess.isFullyCleared ? 'success' : 'warning'}
              className="p-5 border-2 space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-current/15 pb-2">
                <div className="flex items-center space-x-2 font-extrabold text-sm text-slate-900 dark:text-white">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{actionSuccess.isFullyCleared ? 'Fine Cleared Successfully' : 'Partial Payment Recorded Successfully'}</span>
                </div>
                <Badge variant={actionSuccess.isFullyCleared ? 'success' : 'warning'} className="font-bold">
                  {actionSuccess.isFullyCleared ? 'STATUS: PAID' : 'STATUS: PENDING'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Student</span>
                  <span className="font-bold text-slate-900 dark:text-white">{actionSuccess.studentName} ({formatRollNumber(actionSuccess.rollNumber)})</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Paid This Time</span>
                  <strong className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">₹{actionSuccess.amountPaid}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Remaining Balance</span>
                  <strong className={`font-extrabold text-sm ${actionSuccess.remainingAmount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    ₹{actionSuccess.remainingAmount}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{actionSuccess.paymentMethod}</span>
                </div>
              </div>
            </Alert>
          )}

          {/* Search Result Card & Fine Table */}
          {searchResult && (
            <div className="space-y-6">
              {/* Student Summary Card */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-[#E8DBC5]/50 dark:bg-[#2D2534] border border-[#E8DBC5] dark:border-[#3B3142] text-[#8D6B94] dark:text-[#B185A7] rounded-2xl shrink-0">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">STUDENT PROFILE</span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {formatRollNumber(searchResult.student.rollNumber)}
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                          {searchResult.student.name}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Department: {searchResult.student.department} • Year {searchResult.student.academicYear} - Sec {searchResult.student.section}
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-5 py-3 rounded-2xl text-right shrink-0">
                      <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block uppercase tracking-wider">Total Outstanding Fine</span>
                      <strong className="text-2xl font-black text-amber-900 dark:text-amber-100">₹{searchResult.totalOutstandingFine}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Fines Selection Table */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <CardHeader className="py-3 px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                    Pending Fine Transactions ({searchResult.pendingFinesCount})
                  </CardTitle>
                  <Badge variant={searchResult.totalOutstandingFine > 0 ? 'danger' : 'success'} className="font-bold">
                    {searchResult.totalOutstandingFine > 0 ? `₹${searchResult.totalOutstandingFine} PENDING` : 'NO OUTSTANDING FINES'}
                  </Badge>
                </CardHeader>

                <CardContent className="p-0">
                  {searchResult.fines.length === 0 ? (
                    <div className="p-8 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/30">
                      No fine records exist for this student account.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-3 pl-4 w-10">Select</th>
                            <th className="p-3">Book & Details</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Original Fine</th>
                            <th className="p-3">Paid Amount</th>
                            <th className="p-3">Outstanding</th>
                            <th className="p-3 pr-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {searchResult.fines.map((f) => {
                            const isSelected = selectedFineId === f._id;
                            const isPending = f.status === 'PENDING';

                            return (
                              <tr
                                key={f._id}
                                className={`transition-colors cursor-pointer ${
                                  isSelected ? 'bg-[#E8DBC5]/50 dark:bg-[#2D2534] border-l-4 border-l-[#8D6B94]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                                onClick={() => isPending && setSelectedFineId(f._id)}
                              >
                                <td className="p-3 pl-4">
                                  <input
                                    type="radio"
                                    name="fineSelection"
                                    checked={isSelected}
                                    onChange={() => setSelectedFineId(f._id)}
                                    disabled={!isPending}
                                    className="h-4 w-4 text-[#8D6B94] focus:ring-[#8D6B94]/30 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-900 dark:text-white">{f.bookTitle}</div>
                                  <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Barcode: {f.barcode || 'N/A'} • Return Condition: {f.condition}</div>
                                </td>
                                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{f.reason}</td>
                                <td className="p-3 font-medium text-slate-600 dark:text-slate-400">₹{f.originalAmount}</td>
                                <td className="p-3 font-semibold text-emerald-700 dark:text-emerald-400">₹{f.paidAmount}</td>
                                <td className="p-3 font-extrabold text-amber-900 dark:text-amber-300 text-sm">₹{f.outstandingAmount}</td>
                                <td className="p-3 pr-4 text-right">
                                  <Badge variant={f.status === 'PAID' ? 'success' : f.status === 'WAIVED' ? 'info' : 'warning'} className="font-bold">
                                    {f.status}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Input Form Card */}
              {searchResult.pendingFinesCount > 0 && selectedFine && (
                <Card className="max-w-xl border-[#E8DBC5] dark:border-[#3B3142] bg-white dark:bg-slate-900 shadow-sm">
                  <CardHeader className="bg-[#E8DBC5]/50 dark:bg-[#2D2534] border-b border-[#E8DBC5] dark:border-[#3B3142]">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                      Record Fine Payment
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Target Book: <strong className="text-slate-900 dark:text-white">{selectedFine.bookTitle}</strong> (Outstanding: ₹{selectedFine.outstandingAmount})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <form onSubmit={openConfirmation} className="space-y-4">
                      {payValidationMsg && (
                        <Alert variant="destructive" className="py-2">
                          <p className="text-xs font-bold">{payValidationMsg}</p>
                        </Alert>
                      )}

                      {actionError && (
                        <Alert variant="destructive" className="py-2">
                          <p className="text-xs font-bold">{actionError}</p>
                        </Alert>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Amount to Pay (₹) *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max={selectedFine.outstandingAmount}
                          value={payAmountInput}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder={`Enter amount (Max ₹${selectedFine.outstandingAmount})...`}
                          required
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Enter full amount (₹{selectedFine.outstandingAmount}) to clear fine or any partial amount.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Payment Method *
                        </label>
                        <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          <option value="CASH">CASH (Counter Cash Collection)</option>
                          <option value="ONLINE">ONLINE (Digital Transfer)</option>
                          <option value="UPI">UPI (QR Code / UPI Payment)</option>
                          <option value="WAIVED">WAIVED (Authorized Staff Waiver)</option>
                        </Select>
                      </div>

                      <Button
                        type="submit"
                        disabled={!payAmountInput || Boolean(payValidationMsg)}
                        className="w-full h-11 bg-[#8D6B94] hover:bg-[#795B80] font-bold text-sm cursor-pointer shadow-xs"
                      >
                        <DollarSign className="w-4 h-4 mr-2" /> Record Payment
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Fine History Tab */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Fine Transaction & Payment History Log</CardTitle>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Filter by Roll Number"
                  value={historyFilterRoll}
                  onChange={(e) => setHistoryFilterRoll(e.target.value.toUpperCase())}
                  className="h-9 text-xs w-48 uppercase font-mono font-semibold"
                />
                <Button size="sm" onClick={fetchHistory} className="h-9 px-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-xs">
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : finesHistory.length === 0 ? (
                <EmptyState icon={DollarSign} title="No Fines Found" description="No historical fine records match the specified query." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Book & Details</TableHead>
                      <TableHead>Original Fine</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payments Log</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finesHistory.map((f) => {
                      const bTx = f.borrowTransaction || {};
                      const orig = f.originalAmount !== undefined ? f.originalAmount : f.amount;
                      const paid = f.paidAmount || 0;
                      const out = f.outstandingAmount !== undefined ? f.outstandingAmount : (f.status === 'PAID' ? 0 : Math.max(0, orig - paid));

                      return (
                        <React.Fragment key={f._id}>
                          <TableRow>
                            <TableCell>
                              <div className="font-bold text-slate-900 dark:text-white">{f.student?.name}</div>
                              <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{formatRollNumber(f.student?.rollNumber)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-slate-900 dark:text-white">{bTx.bookCopy?.book?.title || 'Library Book'}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">Reason: {f.reason}</div>
                            </TableCell>
                            <TableCell className="font-medium text-slate-700 dark:text-slate-300">₹{orig}</TableCell>
                            <TableCell className="font-semibold text-emerald-700 dark:text-emerald-400">₹{paid}</TableCell>
                            <TableCell className="font-extrabold text-slate-900 dark:text-white">₹{out}</TableCell>
                            <TableCell>
                              <Badge variant={f.status === 'PAID' ? 'success' : f.status === 'WAIVED' ? 'info' : 'warning'} className="font-bold">
                                {f.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {f.payments?.length > 0 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[11px] h-7 px-2"
                                  onClick={() => setExpandedPaymentId(expandedPaymentId === f._id ? null : f._id)}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  {f.payments.length} Payment(s)
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500">No Payments</span>
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Expanded Payments Log Row */}
                          {expandedPaymentId === f._id && f.payments?.length > 0 && (
                            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                              <TableCell colSpan={7} className="p-4">
                                <div className="space-y-2 max-w-2xl mx-auto">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#B185A7]" />
                                    Payment Audit History Log
                                  </h4>
                                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {f.payments.map((p, pIdx) => (
                                      <div key={pIdx} className="p-2.5 flex items-center justify-between">
                                        <div>
                                          <span className="font-bold text-slate-900 dark:text-white">Paid ₹{p.amount}</span>
                                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] ml-2">({p.paymentMethod})</span>
                                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                            Prev: ₹{p.previousOutstanding} &rarr; Rem: ₹{p.remainingOutstanding}
                                          </div>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-500 dark:text-slate-400">
                                          <div>{new Date(p.createdAt).toLocaleString()}</div>
                                          <div>By: {p.paidBy?.username || 'Staff'}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Confirm Fine Payment Entry
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Please review the payment details before committing this transaction.
            </DialogDescription>
          </DialogHeader>

          {selectedFine && searchResult && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs my-2">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Student</span>
                <span className="font-bold text-slate-900 dark:text-white">{searchResult.student.name} ({formatRollNumber(searchResult.student.rollNumber)})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Book Title</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedFine.bookTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Current Outstanding</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{selectedFine.outstandingAmount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Paying This Time</span>
                <strong className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">₹{Number(payAmountInput)}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Remaining Balance</span>
                <strong className="font-extrabold text-amber-800 dark:text-amber-300 text-sm">
                  ₹{Math.max(0, selectedFine.outstandingAmount - Number(payAmountInput))}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Payment Method</span>
                <span className="font-bold text-slate-900 dark:text-white">{paymentMethod}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={actionLoading}
              onClick={handleConfirmPaySubmit}
              className="bg-[#8D6B94] hover:bg-[#795B80] font-bold text-white"
            >
              Confirm & Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
