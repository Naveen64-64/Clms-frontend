import React, { useEffect } from 'react';
import { Printer, CheckCircle2, ShieldCheck, Download, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatCertificateDate } from '../../lib/utils';

export const DigitalNoDueForm = ({ requestData, onClose, autoPrint = false }) => {
  useEffect(() => {
    if (autoPrint && requestData) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, requestData]);

  if (!requestData) return null;

  const rollNumber = requestData.rollNumber || requestData.student?.rollNumber || '';
  const studentName = requestData.studentName || requestData.student?.name || '';
  const fathersName = requestData.fathersName || requestData.student?.fathersName || '';
  const department = requestData.department || requestData.student?.department || 'CSE';
  const academicYear = requestData.academicYear || requestData.student?.academicYear || 'IV';
  const reason = requestData.reason || 'Course Completed';
  const assignedLibraryName = requestData.assignedLibraryName || requestData.assignedLibrary?.name || 'KIET Library';
  const reviewedByName = requestData.reviewedByName || 'Authorized Librarian';
  const approvedAt = requestData.approvedAt || requestData.reviewedAt;
  const requestDate = requestData.requestDate || requestData.createdAt;
  const enclosures = requestData.enclosures;

  const formattedReqDate = formatCertificateDate(requestDate, formatCertificateDate(new Date(), '—'));
  const formattedAppDate = formatCertificateDate(approvedAt, formattedReqDate || '—');


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Bar (Screen Only) */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-lg print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500 rounded-lg text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Digital No Due Certificate Generated</h3>
            <p className="text-xs text-slate-300">Official Library TC Clearance Document</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable A4 Document Container */}
      <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-xl border border-slate-300 shadow-2xl max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
        {/* Printable Header Section */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
          <div className="flex items-center justify-center space-x-3 mb-1">
            <div className="w-12 h-12 rounded-full bg-[#8D6B94] text-white font-black text-xl flex items-center justify-center shadow-xs">
              K
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
                KIET GROUP OF INSTITUTIONS
              </h1>
              <p className="text-[10px] text-slate-600 font-semibold tracking-wide uppercase">
                (Approved by AICTE & Govt. of A.P., Affiliated to JNTUK)
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 font-medium">
            Yanam Road, Korangi, Tallarevu (M), East Godavari Dist., A.P. - 533461
          </p>

          <div className="mt-3 pt-2 border-t border-slate-300">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase underline tracking-wide text-slate-900">
              Application for issue of Transfer Certificate & Original Certificates
            </h2>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              (Transfer Certificate will be issued within Three Days after clear remark of all the authorities)
            </p>
          </div>
        </div>

        {/* Top Info Header Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs font-semibold mb-4 bg-slate-50 p-3 rounded-md border border-slate-200">
          <div className="flex items-center">
            <span className="text-slate-500 w-32 font-bold uppercase text-[10px]">Hall Ticket No.:</span>
            <span className="font-mono font-black text-sm text-slate-900">{rollNumber}</span>
          </div>
          <div className="flex items-center text-right justify-end">
            <span className="text-slate-500 w-16 font-bold uppercase text-[10px]">Date:</span>
            <span className="font-bold text-slate-900">{formattedReqDate}</span>
          </div>
        </div>

        {/* Student Details Form Table */}
        <div className="space-y-3 text-xs mb-5">
          <div className="border border-slate-300 rounded-md overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-slate-200">
              <div className="p-2.5 bg-white flex">
                <span className="w-48 font-bold text-slate-700 uppercase text-[10px] shrink-0">Name of the Student:</span>
                <span className="font-black text-sm uppercase text-slate-900">{studentName}</span>
              </div>
              <div className="p-2.5 bg-slate-50/60 flex">
                <span className="w-48 font-bold text-slate-700 uppercase text-[10px] shrink-0">Father's Name:</span>
                <span className="font-bold text-slate-900 uppercase">{fathersName || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-white grid grid-cols-3 gap-2">
                <div>
                  <span className="font-bold text-slate-700 uppercase text-[10px] block">Year:</span>
                  <span className="font-extrabold text-slate-900">Year {academicYear || 'IV'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 uppercase text-[10px] block">Course:</span>
                  <span className="font-extrabold text-slate-900">B.Tech</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 uppercase text-[10px] block">Branch:</span>
                  <span className="font-extrabold text-slate-900">{department || 'CSE'}</span>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50/60 flex">
                <span className="w-48 font-bold text-slate-700 uppercase text-[10px] shrink-0">Reasons for TC:</span>
                <span className="font-extrabold text-slate-900">{reason}</span>
              </div>
            </div>
          </div>

          {/* Enclosures checklist */}
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">Enclosures Checklist:</span>
            <div className="flex items-center space-x-6 text-slate-800 font-medium">
              <label className="flex items-center space-x-1.5 cursor-default">
                <input type="checkbox" checked={enclosures?.idCard !== false} readOnly className="rounded text-emerald-600 focus:ring-0" />
                <span>ID Card</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-default">
                <input type="checkbox" checked={enclosures?.libraryCard !== false} readOnly className="rounded text-emerald-600 focus:ring-0" />
                <span>Library Card</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-default">
                <input type="checkbox" checked={Boolean(enclosures?.photocopyPC)} readOnly className="rounded text-emerald-600 focus:ring-0" />
                <span>Photocopy of PC</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between items-end pt-2 text-xs">
            <p className="text-slate-600 font-medium italic">
              So, I request you to do the needful and issue me my Transfer Certificate.
            </p>
            <div className="text-right pt-4">
              <p className="font-mono font-semibold text-slate-900">________________________</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Signature of Student</p>
            </div>
          </div>
        </div>

        {/* NO DUES CERTIFICATE TABLE SECTION */}
        <div className="my-6">
          <div className="bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider text-center py-1.5 rounded-t-md">
            NO DUES CERTIFICATE
          </div>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
              <tr>
                <th className="p-2.5 border-r border-slate-300 w-1/4">Department</th>
                <th className="p-2.5 border-r border-slate-300 w-1/3">No Dues / Dues Status</th>
                <th className="p-2.5 w-5/12">Authority Verification & Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Fees Counter Row */}
              <tr className="bg-slate-50/50">
                <td className="p-2.5 font-bold border-r border-slate-300 text-slate-700">Fees Counter</td>
                <td className="p-2.5 border-r border-slate-300 text-slate-400 italic">—</td>
                <td className="p-2.5 text-slate-400 text-[11px] italic">Fee Counter Office</td>
              </tr>

              {/* Library Row (POPULATED FROM CLMS DATABASE) */}
              <tr className="bg-emerald-50/80 border-2 border-emerald-500">
                <td className="p-2.5 font-black border-r border-slate-300 text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Library ({assignedLibraryName || 'KIET Library'})
                </td>
                <td className="p-2.5 border-r border-slate-300 font-black text-emerald-700 text-sm">
                  NO DUE
                </td>
                <td className="p-2.5">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-900 text-xs">{reviewedByName || 'Authorized Librarian'}</p>
                    <p className="text-[10px] text-slate-600 font-medium">
                      Date: <strong className="text-slate-900">{formattedAppDate}</strong>
                    </p>
                    <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                      Verified & Approved in CLMS System
                    </p>
                  </div>
                </td>
              </tr>

              {/* Exam Cell Row */}
              <tr className="bg-slate-50/50">
                <td className="p-2.5 font-bold border-r border-slate-300 text-slate-700">Exam Cell</td>
                <td className="p-2.5 border-r border-slate-300 text-slate-400 italic">—</td>
                <td className="p-2.5 text-slate-400 text-[11px] italic">Exam Cell Office</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Authority Signatures */}
        <div className="pt-8 mt-6 border-t border-slate-300">
          <div className="grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800 uppercase tracking-wider">
            <div>
              <p className="pt-6 border-t border-slate-400">Head of the Department</p>
            </div>
            <div>
              <p className="pt-6 border-t border-slate-400">A.O.</p>
            </div>
            <div>
              <p className="pt-6 border-t border-slate-400">PRINCIPAL</p>
            </div>
          </div>

          {/* Office Use Section */}
          <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-300 text-[11px] text-slate-600 space-y-3">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] italic">for Office Use:</p>
            <div className="grid grid-cols-3 gap-4">
              <div>T.C No.: _________________</div>
              <div>T.C Date: _____/_____/_________</div>
              <div>Admission No.: _________________</div>
            </div>
            <div>Remarks of the Clerk: __________________________________________________________________</div>
            <div className="pt-4 flex justify-between items-center text-slate-800 font-semibold">
              <span>Received TC / Original Certificates: ______________________</span>
              <span>(Student's Signature) _____/_____/________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
