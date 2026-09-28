import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { borrowApi } from '../../api/borrowApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatRollNumber } from '../../lib/utils';

export const IssueBookPage = () => {
  const location = useLocation();
  const [rollNumber, setRollNumber] = useState('');
  const [bookId, setBookId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [issueResult, setIssueResult] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchRoll = params.get('rollNumber');
    if (searchRoll) {
      setRollNumber(searchRoll.toUpperCase());
    }
    if (location.state?.prefilledBookId) {
      setBookId(location.state.prefilledBookId);
    }
  }, [location]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim() || !bookId.trim()) {
      setErrorMsg('Please enter both Borrower ID and Book ID');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setIssueResult(null);

    try {
      const trimmedBook = bookId.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(trimmedBook);
      const res = await borrowApi.issueBook({
        rollNumber: rollNumber.trim().toUpperCase(),
        bookId: isObjectId ? trimmedBook : undefined,
        callNo: !isObjectId ? trimmedBook : undefined,
      });

      if (res?.data) {
        setIssueResult(res.data);
        setRollNumber('');
        setBookId('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Book issue failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <ArrowUpRight className="h-6 w-6 text-[#8D6B94] dark:text-[#B185A7]" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Issue Book</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Backend automatically assigns available physical copies from your assigned library scope.
        </p>
      </div>

      <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Issue Workflow Terminal</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Enter Student Roll Number or Faculty ID and Book ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Student Roll Number / Faculty ID *</label>
              <Input
                placeholder="e.g. STU210001 or FAC001"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                className="font-mono uppercase font-bold text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Book ID *</label>
              <Input
                placeholder="e.g. 660f1b2c3d4e... or Book ID"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="font-mono text-base font-semibold"
                required
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Enter the Book ID from the Book Catalog search or details view.</p>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
              <ArrowUpRight className="w-5 h-5 mr-2" /> Confirm & Issue Book
            </Button>
          </form>

          {errorMsg && (
            <Alert variant="destructive">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Issue Operation Rejected</span>
              </div>
              <p className="text-xs">{errorMsg}</p>
            </Alert>
          )}

          {issueResult && (
            <Alert variant="success" className="space-y-3 p-4 border-2">
              <div className="flex items-center space-x-2 font-bold text-base text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Book Issued Successfully!</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-emerald-200">
                <div>
                  <span className="text-slate-500 block">Borrower:</span>
                  <strong className="text-slate-900">
                    {issueResult.student?.name || issueResult.faculty?.name} ({formatRollNumber(issueResult.student?.rollNumber) || issueResult.faculty?.facultyId})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Book Title & ID:</span>
                  <strong className="text-slate-900 block">{issueResult.bookCopy?.book?.title}</strong>
                  <span className="font-mono text-[10px] text-slate-600 block">ID: {issueResult.bookId || issueResult.masterBook || issueResult.bookCopy?.book?._id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Issue Date:</span>
                  <span className="font-semibold text-slate-800">{new Date(issueResult.issueDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">System Due Date:</span>
                  <strong className="font-bold text-[#8D6B94]">{new Date(issueResult.dueDate).toLocaleDateString()}</strong>
                </div>
                {issueResult.availableCopies !== undefined && (
                  <div className="col-span-2 pt-2 border-t border-emerald-200 flex items-center justify-between">
                    <span className="text-slate-600 font-bold">Updated Inventory Availability:</span>
                    <strong className="text-emerald-800 font-mono text-xs">
                      Copies: {issueResult.availableCopies}/{issueResult.totalCopies} ({issueResult.issuedCopies} issued)
                    </strong>
                  </div>
                )}
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
