import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { fineApi } from '../../api/fineApi';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  DollarSign,
  Printer,
  User,
  UserX,
  ShieldAlert,
  X
} from 'lucide-react';
import { formatRollNumber } from '../../lib/utils';

export const TcClearancePage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearanceData, setClearanceData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [processingFineId, setProcessingFineId] = useState(null);

  // Student Data Clearance Modal & State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [confirmRollInput, setConfirmRollInput] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeError, setPurgeError] = useState(null);
  const [purgeResult, setPurgeResult] = useState(null);

  const executeSearchForRoll = async (targetRoll) => {
    if (!targetRoll) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPurgeResult(null);

    try {
      const res = await studentApi.getTcClearance(targetRoll.trim());
      if (res?.data) {
        setClearanceData(res.data);
      }
    } catch (err) {
      setClearanceData(null);
      setErrorMsg(err.message || 'Failed to fetch student TC clearance status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchRoll = params.get('rollNumber');
    if (searchRoll) {
      setRollNumber(searchRoll.toUpperCase());
      executeSearchForRoll(searchRoll.toUpperCase());
    }
  }, [location.search]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!rollNumber.trim()) {
      setErrorMsg('Please enter a valid student roll number.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPurgeResult(null);

    try {
      const res = await studentApi.getTcClearance(rollNumber.trim());
      if (res?.data) {
        setClearanceData(res.data);
      }
    } catch (err) {
      setClearanceData(null);
      setErrorMsg(err.message || 'Failed to fetch student TC clearance status.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFine = async (transactionId) => {
    if (!transactionId) return;
    setProcessingFineId(transactionId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await fineApi.payFine({
        transactionId,
        paymentMethod: 'CASH'
      });
      setSuccessMsg('Fine cleared successfully!');
      handleSearch();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to clear fine.');
    } finally {
      setProcessingFineId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenClearModal = () => {
    setConfirmRollInput('');
    setPurgeError(null);
    setIsClearModalOpen(true);
  };

  const handleExecutePurge = async (e) => {
    e.preventDefault();
    if (!clearanceData?.student?.rollNumber) return;

    const targetRoll = clearanceData.student.rollNumber.trim().toUpperCase();
    const typedRoll = confirmRollInput.trim().toUpperCase();

    if (targetRoll !== typedRoll) {
      setPurgeError(`Confirmation Roll Number (${typedRoll}) does not match target Roll Number (${targetRoll})`);
      return;
    }

    setPurging(true);
    setPurgeError(null);

    try {
      const res = await studentApi.clearStudentData(targetRoll, typedRoll);
      if (res?.data) {
        setIsClearModalOpen(false);
        setPurgeResult({
          rollNumber: targetRoll,
          studentName: clearanceData.student.name
        });
        setClearanceData(null);
        setRollNumber('');
      }
    } catch (err) {
      setPurgeError(err.message || 'Failed to clear student library data.');
    } finally {
      setPurging(false);
    }
  };

  const handleResetAfterPurge = () => {
    setPurgeResult(null);
    setRollNumber('');
    setClearanceData(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const isRollNumberConfirmed = Boolean(
    clearanceData?.student?.rollNumber &&
      confirmRollInput.trim().toUpperCase() === clearanceData.student.rollNumber.trim().toUpperCase()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-[#8D6B94]" />
            TC Clearance & Exit Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Check student obligations before TC issuance, print certificate, and execute final student exit data clearance.
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 print:hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                placeholder="Enter Student Roll Number (e.g. 210001)..."
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className="h-12 px-6 bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-sm cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4 mr-2" />
              Check Clearance
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error & Success Feedback Alerts */}
      {errorMsg && (
        <Alert variant="destructive" className="print:hidden">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold text-xs">{errorMsg}</span>
          </div>
        </Alert>
      )}

      {successMsg && (
        <Alert className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 p-4 print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">{successMsg}</span>
          </div>
        </Alert>
      )}

      {/* FINAL SUCCESS SCREEN AFTER DATA CLEARANCE */}
      {purgeResult && (
        <Card className="border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-md p-6 print:hidden space-y-4">
          <div className="flex items-center space-x-3 text-emerald-900 dark:text-emerald-100">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Student Data Cleared Successfully</h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                Personal account and operational profile removed from active library system.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Student Name:</span>
                <strong className="text-slate-900 dark:text-white text-sm font-bold">{purgeResult.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Roll Number:</span>
                <strong className="font-mono text-slate-900 dark:text-white text-sm font-bold">{formatRollNumber(purgeResult.rollNumber)}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Library Clearance:</span>
                <Badge variant="success" className="font-bold">COMPLETED</Badge>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Student Account State:</span>
                <strong className="text-rose-700 dark:text-rose-400 font-bold">REMOVED (Login Disabled)</strong>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              Institutional borrowing and financial history have been safely anonymized to preserve audit trails and report integrity.
            </p>
          </div>

          <Button
            onClick={handleResetAfterPurge}
            className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            Back to TC Clearance
          </Button>
        </Card>
      )}

      {/* TC Clearance Result View */}
      {clearanceData && (
        <div className="space-y-6">
          {/* Printable Clearance Certificate Document Header */}
          <div className="hidden print:block text-center space-y-2 border-b border-slate-300 pb-6 mb-6">
            <h1 className="text-2xl font-black uppercase text-slate-900 tracking-wider">KIET GROUP OF INSTITUTIONS</h1>
            <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">KDL - KIET DIGITAL LIBRARY</h2>
            <h3 className="text-lg font-extrabold text-[#8D6B94] uppercase tracking-widest mt-2 underline">
              LIBRARY CLEARANCE CERTIFICATE (FOR TC)
            </h3>
          </div>

          {/* Decision Status Banner */}
          <Card
            className={`border-2 shadow-xs transition-all ${
              clearanceData.status === 'CLEAR'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                : 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/40'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3.5 rounded-2xl text-white shadow-xs shrink-0 ${
                      clearanceData.status === 'CLEAR' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {clearanceData.status === 'CLEAR' ? (
                      <CheckCircle2 className="w-9 h-9" />
                    ) : (
                      <XCircle className="w-9 h-9" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">CLEARANCE DECISION</span>
                      <Badge
                        className={`text-xs font-black px-3 py-0.5 uppercase tracking-wider ${
                          clearanceData.status === 'CLEAR'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {clearanceData.decision}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                      {clearanceData.student.name} ({formatRollNumber(clearanceData.student.rollNumber)})
                    </h2>
                    {clearanceData.status === 'CLEAR' ? (
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                        All borrowed books returned. Outstanding fine ₹0. Student is eligible for Transfer Certificate clearance.
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1">
                        Return outstanding books and clear library fines before issuing TC clearance.
                      </p>
                    )}
                  </div>
                </div>

                {/* Print Certificate & Clear Student Data Buttons */}
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  {clearanceData.status === 'CLEAR' && (
                    <Button
                      onClick={handlePrint}
                      className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs gap-2 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      Print Certificate
                    </Button>
                  )}

                  <Button
                    disabled={clearanceData.status !== 'CLEAR'}
                    onClick={handleOpenClearModal}
                    className={`font-bold text-xs gap-1.5 cursor-pointer shadow-xs ${
                      clearanceData.status === 'CLEAR'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <UserX className="w-4 h-4" />
                    Clear Student Data
                  </Button>
                </div>
              </div>

              {/* Reasons if HOLD */}
              {clearanceData.reasons?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-rose-200/80 dark:border-rose-900/50 space-y-1.5">
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">Reasons for Hold:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs font-semibold text-rose-800 dark:text-rose-300">
                    {clearanceData.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Profile Overview */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="py-3 px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Student Identification Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Roll Number</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">{formatRollNumber(clearanceData.student.rollNumber)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{clearanceData.student.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{clearanceData.student.department}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Academic Year & Section</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    Year {clearanceData.student.academicYear} - Section {clearanceData.student.section}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Borrowed Books Status */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="py-3 px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Active Borrowed Books ({clearanceData.activeBorrowsCount})
              </CardTitle>
              <Badge variant={clearanceData.activeBorrowsCount === 0 ? 'success' : 'danger'}>
                {clearanceData.activeBorrowsCount === 0 ? 'ALL RETURNED' : `${clearanceData.activeBorrowsCount} UNRETURNED`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {clearanceData.activeBorrows.length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/30">
                  No active borrowed books found. All books returned cleanly.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Book Title</th>
                        <th className="p-3">Copy ID</th>
                        <th className="p-3">Library</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3 pr-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clearanceData.activeBorrows.map((b) => (
                        <tr key={b.transactionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">{b.bookTitle}</td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{b.barcode || 'N/A'}</td>
                          <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{b.libraryName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{new Date(b.issueDate).toLocaleDateString()}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 font-semibold">{new Date(b.dueDate).toLocaleDateString()}</td>
                          <td className="p-3 pr-4 text-right">
                            <Badge className={b.status === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}>
                              {b.status}
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

          {/* Pending Fines & Clearance Actions */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="py-3 px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
                Pending Fines (₹{clearanceData.pendingFineTotal})
              </CardTitle>
              <Badge variant={clearanceData.pendingFineTotal === 0 ? 'success' : 'danger'}>
                {clearanceData.pendingFineTotal === 0 ? '₹0 PENDING' : `₹${clearanceData.pendingFineTotal} OUTSTANDING`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {clearanceData.pendingFines.length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/30">
                  No outstanding fines. Total fine obligation ₹0.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Overdue Item</th>
                        <th className="p-3">Fine Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 pr-4 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clearanceData.pendingFines.map((f) => (
                        <tr key={f.fineTransactionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">{f.bookTitle}</td>
                          <td className="p-3 font-mono font-extrabold text-rose-600 dark:text-rose-400">₹{f.amount}</td>
                          <td className="p-3">
                            <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800 font-bold">PENDING</Badge>
                          </td>
                          <td className="p-3 pr-4 text-right print:hidden">
                            <Button
                              size="sm"
                              isLoading={processingFineId === f.borrowTransactionId}
                              onClick={() => handleClearFine(f.borrowTransactionId)}
                              className="font-bold text-xs h-8 cursor-pointer"
                            >
                              Clear / Pay ₹{f.amount}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Physical Signature Section for Printable View */}
          <div className="hidden print:block pt-16 mt-12 border-t border-slate-300">
            <div className="grid grid-cols-2 gap-8 text-xs font-semibold text-slate-900">
              <div>
                <p>Date of Clearance: <strong>{new Date().toLocaleDateString()}</strong></p>
                <p className="mt-1">Verified By: <strong>{user?.username || 'Librarian In-Charge'}</strong></p>
              </div>
              <div className="text-right space-y-8">
                <p className="font-mono">Librarian Signature: ______________________</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Official Library Seal / Stamp</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR DESTRUCTIVE STUDENT DATA CLEARANCE */}
      {isClearModalOpen && clearanceData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Clear Student Data?</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Permanent Exit & Operational Account Purge</p>
                </div>
              </div>
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will permanently remove the student's active library account, credentials, and personal operational profile.
              <strong> This action cannot be undone.</strong>
            </p>

            {/* Clearance Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Student Name:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{clearanceData.student.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Roll Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{clearanceData.student.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Clearance Decision:</span>
                <Badge variant="success" className="font-bold">READY FOR TC</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Outstanding Fines:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Active Books:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">0</span>
              </div>
            </div>

            {/* Roll Number Confirmation Form */}
            <form onSubmit={handleExecutePurge} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Type Roll Number <span className="font-mono font-black text-rose-700 dark:text-rose-400">{formatRollNumber(clearanceData.student.rollNumber)}</span> to confirm:
                </label>
                <Input
                  type="text"
                  value={confirmRollInput}
                  onChange={(e) => setConfirmRollInput(e.target.value.toUpperCase())}
                  placeholder={`Type ${formatRollNumber(clearanceData.student.rollNumber)}`}
                  className="font-mono uppercase font-bold text-sm h-11 border-slate-300 dark:border-slate-700 focus:ring-rose-500"
                  autoComplete="off"
                  required
                />
              </div>

              {purgeError && (
                <Alert variant="destructive">
                  <div className="flex items-center space-x-2 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{purgeError}</span>
                  </div>
                </Alert>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsClearModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={purging}
                  disabled={!isRollNumberConfirmed || purging}
                  className={`font-bold text-xs gap-1.5 cursor-pointer shadow-xs ${
                    isRollNumberConfirmed
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <UserX className="w-4 h-4" />
                  Permanently Clear Student Data
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
