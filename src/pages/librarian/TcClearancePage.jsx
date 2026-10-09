import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tcClearanceApi } from '../../api/tcClearanceApi';
import { studentApi } from '../../api/studentApi';
import { fineApi } from '../../api/fineApi';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { DigitalNoDueForm } from '../../components/tcClearance/DigitalNoDueForm';
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
  Building2,
  Clock,
  Eye,
  Check,
  X,
  FileText,
  UserX,
  ShieldAlert
} from 'lucide-react';
import { formatCertificateDate, formatRollNumber } from '../../lib/utils';

export const TcClearancePage = () => {
  const { librarianProfile } = useAuth();
  const location = useLocation();

  // Tab & Filter State
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | APPROVED | REJECTED | ALL
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState({ requests: [], counts: {}, library: {} });
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Review Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDetails, setReviewDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection Dialog State
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Certificate Preview Modal State
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await tcClearanceApi.getRequestsQueue({
        status: activeTab,
        search: searchQuery
      });
      if (res?.data) {
        setQueueData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch TC Clearance requests queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQueue();
  };

  const handleOpenReview = async (reqItem) => {
    setSelectedRequest(reqItem);
    setReviewLoading(true);
    setErrorMsg(null);
    try {
      const res = await tcClearanceApi.getRequestDetails(reqItem._id);
      if (res?.data) {
        setReviewDetails(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load request details.');
      setSelectedRequest(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await tcClearanceApi.approveRequest(selectedRequest._id);
      setSuccessMsg(`TC Clearance approved for ${selectedRequest.studentName} (${selectedRequest.rollNumber}).`);
      setSelectedRequest(null);
      setReviewDetails(null);
      fetchQueue();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to approve request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = () => {
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleExecuteReject = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !rejectionReason.trim()) {
      setErrorMsg('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await tcClearanceApi.rejectRequest(selectedRequest._id, rejectionReason.trim());
      setSuccessMsg(`TC Clearance request for ${selectedRequest.studentName} rejected.`);
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setReviewDetails(null);
      fetchQueue();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCertificate = (reqItem) => {
    setCertificateData(reqItem);
    setShowCertificate(true);
  };

  const libraryName = queueData.library?.name || librarianProfile?.assignedLibrary?.name || 'Assigned Library';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-[#8D6B94] dark:text-[#B185A7]" />
            TC Clearance & No Due Requests
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Review student No Due requests, verify library obligations, and grant digital TC clearance.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#8D6B94]/15 px-3 py-1.5 rounded-xl text-xs font-bold text-[#8D6B94] dark:text-[#B185A7] shrink-0 border border-[#8D6B94]/30">
          <Building2 className="w-4 h-4" />
          <span>{libraryName}</span>
        </div>
      </div>

      {/* Alert Feedbacks */}
      {errorMsg && (
        <Alert variant="destructive">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold text-xs">{errorMsg}</span>
          </div>
        </Alert>
      )}

      {successMsg && (
        <Alert className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">{successMsg}</span>
          </div>
        </Alert>
      )}

      {/* Filter Tabs & Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Queue Tabs */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {[
                { id: 'PENDING', label: 'Pending', count: queueData.counts?.pending || 0, color: 'bg-amber-500' },
                { id: 'APPROVED', label: 'Approved', count: queueData.counts?.approved || 0, color: 'bg-emerald-600' },
                { id: 'REJECTED', label: 'Rejected', count: queueData.counts?.rejected || 0, color: 'bg-rose-600' },
                { id: 'ALL', label: 'All Requests', count: queueData.counts?.all || 0, color: 'bg-slate-700' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full text-white font-extrabold ${tab.color}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 max-w-sm w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Roll No or Name..."
                  className="pl-9 h-10 text-xs"
                />
              </div>
              <Button type="submit" size="sm" className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold h-10 text-xs cursor-pointer">
                Search
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* REQUESTS QUEUE TABLE */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="py-3 px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#8D6B94]" />
            Request Queue ({queueData.requests?.length || 0})
          </CardTitle>
          <span className="text-[11px] font-semibold text-slate-500">
            Showing requests for <strong>{libraryName}</strong> ONLY
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-500">
              Loading No Due requests queue...
            </div>
          ) : queueData.requests?.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-500">
              No No Due / TC clearance requests found in this view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[10px]">
                  <tr>
                    <th className="p-3 pl-4">Student Name</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3">Branch & Year</th>
                    <th className="p-3">Requested On</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {queueData.requests.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">
                        {item.studentName || item.student?.name}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatRollNumber(item.rollNumber)}
                      </td>
                      <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                        {item.department || item.student?.department} (Year {item.academicYear || item.student?.academicYear})
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">
                        {formatCertificateDate(item.requestDate, 'N/A')}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
                        {item.reason}
                      </td>
                      <td className="p-3">
                        {item.status === 'PENDING' && (
                          <Badge className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5">PENDING</Badge>
                        )}
                        {item.status === 'APPROVED' && (
                          <Badge className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5">APPROVED</Badge>
                        )}
                        {item.status === 'REJECTED' && (
                          <Badge className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5">REJECTED</Badge>
                        )}
                      </td>
                      <td className="p-3 pr-4 text-right space-x-2">
                        {item.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenReview(item)}
                            className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-xs h-8 cursor-pointer shadow-xs"
                          >
                            Review
                          </Button>
                        )}
                        {item.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCertificate(item)}
                            className="font-bold text-xs h-8 cursor-pointer border-emerald-600 text-emerald-700 dark:text-emerald-300 gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            View Form
                          </Button>
                        )}
                        {item.status === 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(item)}
                            className="font-bold text-xs h-8 cursor-pointer text-slate-700 dark:text-slate-300 gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* REVIEW REQUEST DIALOG MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#8D6B94]" />
                  Review No Due / TC Clearance Request
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Library: <strong>{selectedRequest.assignedLibraryName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewLoading ? (
              <div className="p-8 text-center text-xs font-semibold text-slate-500">
                Loading student clearance details...
              </div>
            ) : reviewDetails ? (
              <div className="space-y-4 text-xs">
                {/* Student identification card */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Full Name:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{selectedRequest.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Roll Number:</span>
                    <strong className="font-mono text-slate-900 dark:text-white font-bold">{formatRollNumber(selectedRequest.rollNumber)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Department & Year:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{selectedRequest.department} (Year {selectedRequest.academicYear})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Email:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">{selectedRequest.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Requested Date:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {formatCertificateDate(selectedRequest.requestDate, 'N/A')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Reason:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{selectedRequest.reason}</span>
                  </div>
                </div>

                {/* ELIGIBILITY BANNER */}
                {selectedRequest.status === 'PENDING' && (
                  reviewDetails.isEligibleForNoDue ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 rounded-xl flex items-center space-x-3 text-emerald-900 dark:text-emerald-100">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="font-black text-sm uppercase">ELIGIBLE FOR NO DUE CERTIFICATE</h4>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Student has 0 active borrowed books and ₹0 outstanding fines.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 rounded-xl space-y-1 text-rose-900 dark:text-rose-100">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <h4 className="font-black text-sm uppercase">NOT ELIGIBLE FOR NO DUE</h4>
                      </div>
                      <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 pl-7">
                        Student has pending library obligations. Resolve outstanding books and fines before approval.
                      </p>
                    </div>
                  )
                )}

                {/* Active Borrowed Books List */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 text-xs flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#8D6B94]" />
                      Active Borrowed Books ({reviewDetails.activeBorrowsCount})
                    </span>
                    <Badge variant={reviewDetails.activeBorrowsCount === 0 ? 'success' : 'danger'}>
                      {reviewDetails.activeBorrowsCount === 0 ? 'CLEARED' : `${reviewDetails.activeBorrowsCount} UNRETURNED`}
                    </Badge>
                  </div>
                  {reviewDetails.activeBorrows.length === 0 ? (
                    <p className="p-3 text-slate-500 text-center text-xs">No active unreturned books.</p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 pl-4">Title</th>
                          <th className="p-2">Copy ID</th>
                          <th className="p-2">Due Date</th>
                          <th className="p-2 text-right pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reviewDetails.activeBorrows.map((b) => (
                          <tr key={b.transactionId}>
                            <td className="p-2 pl-4 font-bold text-slate-900 dark:text-white">{b.bookTitle}</td>
                            <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{b.barcode}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-400">{formatCertificateDate(b.dueDate, 'N/A')}</td>
                            <td className="p-2 text-right pr-4">
                              <Badge className={b.status === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}>
                                {b.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Outstanding Fines List */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 text-xs flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#8D6B94]" />
                      Pending Fines (Total: ₹{reviewDetails.pendingFineTotal})
                    </span>
                    <Badge variant={reviewDetails.pendingFineTotal === 0 ? 'success' : 'danger'}>
                      {reviewDetails.pendingFineTotal === 0 ? '₹0 FINES' : `₹${reviewDetails.pendingFineTotal} PENDING`}
                    </Badge>
                  </div>
                  {reviewDetails.pendingFines.length === 0 ? (
                    <p className="p-3 text-slate-500 text-center text-xs">No outstanding fines.</p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 pl-4">Reason</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2 text-right pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reviewDetails.pendingFines.map((f) => (
                          <tr key={f.fineTransactionId}>
                            <td className="p-2 pl-4 text-slate-800 dark:text-slate-200">{f.reason}</td>
                            <td className="p-2 font-mono font-bold text-rose-600">₹{f.amount}</td>
                            <td className="p-2 text-right pr-4">
                              <Badge className="bg-rose-100 text-rose-800 font-bold">PENDING</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedRequest.status === 'PENDING' && (
                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenReject}
                      isLoading={actionLoading}
                      className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold text-xs cursor-pointer"
                    >
                      Reject Request
                    </Button>
                    <Button
                      type="button"
                      disabled={!reviewDetails.isEligibleForNoDue || actionLoading}
                      isLoading={actionLoading}
                      onClick={handleApprove}
                      className={`font-bold text-xs gap-1.5 cursor-pointer shadow-md ${
                        reviewDetails.isEligibleForNoDue
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Approve / Accept No Due
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* REJECTION REASON DIALOG MODAL */}
      {isRejectDialogOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white text-rose-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Reject No Due Request
              </h3>
              <button
                onClick={() => setIsRejectDialogOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReject} className="space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Please enter the reason for rejecting <strong>{selectedRequest.studentName}</strong>'s request:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Outstanding fine of ₹50 or unreturned book..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectDialogOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={actionLoading}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE PREVIEW MODAL */}
      {showCertificate && certificateData && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible">
          <div className="max-w-4xl w-full my-8 print:my-0 print:max-w-none print:w-full">
            <DigitalNoDueForm
              requestData={certificateData}
              onClose={() => setShowCertificate(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
