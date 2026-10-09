import React, { useState, useEffect } from 'react';
import { tcClearanceApi } from '../../api/tcClearanceApi';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';
import { DigitalNoDueForm } from '../../components/tcClearance/DigitalNoDueForm';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Building2,
  BookOpen,
  Printer,
  Download,
  Send,
  X,
  FileText
} from 'lucide-react';
import { formatRollNumber, formatCertificateDate } from '../../lib/utils';

export const StudentTcClearance = () => {
  const { user, studentProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form Modal State for submitting request
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reasonSelect, setReasonSelect] = useState('Course Completed');
  const [customReason, setCustomReason] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Digital Certificate View Modal State
  const [showCertificate, setShowCertificate] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  const handleOpenCertificate = (shouldPrint = false) => {
    setAutoPrint(shouldPrint);
    setShowCertificate(true);
  };

  const fetchMyRequest = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await tcClearanceApi.getMyRequest();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch No Due request status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequest();
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const finalReason = reasonSelect === 'Other' ? customReason.trim() : reasonSelect;

    if (!finalReason) {
      setErrorMsg('Please specify a valid reason for requesting No Due clearance.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await tcClearanceApi.submitRequest({
        reason: finalReason,
        fathersName: fathersName.trim()
      });
      setIsFormOpen(false);
      await fetchMyRequest();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit No Due request.');
    } finally {
      setSubmitting(false);
    }
  };

  const student = data?.student || studentProfile;
  const request = data?.request;
  const obligations = data?.obligations;
  const status = request?.status || 'NONE';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-[#8D6B94] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading No Due request status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-[#8D6B94] dark:text-[#B185A7]" />
            No Due / TC Clearance Request
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Submit request for Library No Due Certificate before Transfer Certificate (TC) issuance.
          </p>
        </div>

        {status === 'NONE' && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-xs gap-2 cursor-pointer shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
            Request No Due Certificate
          </Button>
        )}
      </div>

      {errorMsg && (
        <Alert variant="destructive">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold text-xs">{errorMsg}</span>
          </div>
        </Alert>
      )}

      {/* STUDENT PROFILE & HOME LIBRARY CARD */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="py-3 px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
            Student Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{student?.name || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Roll Number</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">{formatRollNumber(student?.rollNumber)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assigned Library</span>
              <p className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-sm mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                {student?.assignedLibrary?.name || 'KIET Library'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{student?.department || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Academic Year</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">Year {student?.academicYear || 'IV'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email</span>
              <p className="font-medium text-slate-700 dark:text-slate-300 truncate text-xs mt-0.5">{student?.email || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REQUEST STATUS SECTION */}

      {/* STATUS: NONE (NO REQUEST YET) */}
      {status === 'NONE' && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-slate-50/50 dark:bg-slate-900/50 text-center p-8 space-y-4">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950/60 text-[#8D6B94] dark:text-[#B185A7] rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">No No Due Request Submitted Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You haven't submitted a No Due / TC clearance request. Submit a request to your home library librarian to obtain your digital clearance.
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-xs gap-2 cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
            Submit No Due Request
          </Button>
        </Card>
      )}

      {/* STATUS: PENDING */}
      {status === 'PENDING' && (
        <Card className="border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 shadow-md p-6 space-y-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-xs shrink-0">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">STATUS</span>
                <Badge className="bg-amber-500 text-white font-black text-xs px-3 py-0.5">PENDING REVIEW</Badge>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                Waiting for Librarian Review
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mt-1">
                Your request has been routed to <strong>{request?.assignedLibraryName || student?.assignedLibrary?.name}</strong> librarian.
                You already have a pending No Due request and cannot submit multiple requests.
              </p>

              <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Requested On:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {formatCertificateDate(request?.requestDate, 'Today')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Reason:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{request?.reason}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Library:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{request?.assignedLibraryName}</strong>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STATUS: APPROVED */}
      {status === 'APPROVED' && (
        <Card className="border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xs shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">STATUS</span>
                  <Badge className="bg-emerald-600 text-white font-black text-xs px-3 py-0.5">APPROVED</Badge>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  No Due Certificate Approved
                </h2>
                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-bold mt-1">
                  All library books returned and fines cleared. Approved by librarian {request?.reviewedByName} ({request?.assignedLibraryName}).
                </p>

                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-900/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Approved By:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{request?.reviewedByName || 'Authorized Librarian'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Approved Date:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {formatCertificateDate(request?.approvedAt, 'N/A')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Library:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{request?.assignedLibraryName}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Download & Print Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                onClick={() => handleOpenCertificate(false)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                Download No Due Form
              </Button>
              <Button
                onClick={() => handleOpenCertificate(true)}
                variant="outline"
                className="font-bold text-xs gap-2 cursor-pointer border-emerald-600 text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-950"
              >
                <Printer className="w-4 h-4" />
                Print No Due Form
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STATUS: REJECTED */}
      {status === 'REJECTED' && (
        <Card className="border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 shadow-md p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-xs shrink-0">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">STATUS</span>
                  <Badge className="bg-rose-600 text-white font-black text-xs px-3 py-0.5">REQUEST REJECTED</Badge>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Request Rejected by Librarian
                </h2>
                <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Librarian Rejection Reason:</span>
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    "{request?.rejectionReason || 'Library obligations pending.'}"
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Reviewed By:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{request?.reviewedByName || 'Librarian'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Reviewed Date:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {formatCertificateDate(request?.reviewedAt, 'N/A')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs gap-2 cursor-pointer shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
              Submit New Request
            </Button>
          </div>
        </Card>
      )}

      {/* SUBMISSION DIALOG MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-[#8D6B94]" />
                No Due / TC Clearance Request
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Student:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{student?.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRollNumber(student?.rollNumber)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Target Library:</span>
                  <strong className="text-[#8D6B94] dark:text-[#B185A7] font-bold">{student?.assignedLibrary?.name || 'KIET Library'}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Reason for requesting No Due / TC *
                </label>
                <select
                  value={reasonSelect}
                  onChange={(e) => setReasonSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-[#8D6B94]"
                >
                  <option value="Course Completed">Course Completed</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              {reasonSelect === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Custom Reason *
                  </label>
                  <Input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Specify reason..."
                    className="text-xs"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Father's Name (for TC Form)
                </label>
                <Input
                  type="text"
                  value={fathersName}
                  onChange={(e) => setFathersName(e.target.value)}
                  placeholder="Enter Father's Name..."
                  className="text-xs uppercase"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={submitting}
                  className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {showCertificate && request && status === 'APPROVED' && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible">
          <div className="max-w-4xl w-full my-8 print:my-0 print:max-w-none print:w-full">
            <DigitalNoDueForm
              requestData={request}
              onClose={() => {
                setShowCertificate(false);
                setAutoPrint(false);
              }}
              autoPrint={autoPrint}
            />
          </div>
        </div>
      )}
    </div>
  );
};
