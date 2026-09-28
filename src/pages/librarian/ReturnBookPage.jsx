import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { borrowApi } from '../../api/borrowApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { ArrowDownLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatRollNumber } from '../../lib/utils';

export const ReturnBookPage = () => {
  const location = useLocation();
  const [rollNumber, setRollNumber] = useState('');
  const [bookId, setBookId] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [returnResult, setReturnResult] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchRoll = params.get('rollNumber') || params.get('userId');
    const searchBook = params.get('bookId') || params.get('barcode') || params.get('callNo');
    if (searchRoll) {
      setRollNumber(searchRoll.toUpperCase());
    }
    if (searchBook) {
      setBookId(searchBook);
    }
    if (location.state?.prefilledBookId) {
      setBookId(location.state.prefilledBookId);
    }
  }, [location]);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim() || !bookId.trim()) {
      setErrorMsg('Please enter both Borrower ID and Book ID');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setReturnResult(null);

    try {
      const trimmedBook = bookId.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(trimmedBook);
      const res = await borrowApi.returnBook({
        rollNumber: rollNumber.trim().toUpperCase(),
        bookId: isObjectId ? trimmedBook : undefined,
        callNo: !isObjectId ? trimmedBook : undefined,
        condition,
      });

      if (res?.data) {
        setReturnResult(res.data);
        setRollNumber('');
        setBookId('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Book return failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <ArrowDownLeft className="h-6 w-6 text-[#8D6B94]" />
          <h1 className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">Process Book Return</h1>
        </div>
        <p className="text-xs text-[#7A697E] dark:text-[#D1C2D4]">
          Atomic return state transition (BORROWED/OVERDUE &rarr; RETURNED), fine calculation, and inventory synchronization.
        </p>
      </div>

      <Card className="shadow-md border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] bg-white dark:bg-[#302731]">
        <CardHeader className="bg-[#E8DBC5]/20 dark:bg-[#2A222B]/60 border-b border-[#E8DBC5]/60 dark:border-[rgba(255,244,233,0.08)]">
          <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">Return & Fine Processing Terminal</CardTitle>
          <CardDescription className="text-xs text-[#7A697E] dark:text-[#D1C2D4]">
            Enter Student Roll Number or Faculty ID, Book ID, and physical copy condition upon return.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#7A697E] dark:text-[#D1C2D4] uppercase tracking-wider">Student Roll Number / Faculty ID *</label>
              <Input
                placeholder="Enter Student Roll Number or Faculty ID (e.g. STU210001 or FAC001)..."
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#7A697E] dark:text-[#D1C2D4] uppercase tracking-wider">Book ID *</label>
              <Input
                placeholder="Enter Book ID (e.g. 660f1b2c3d4e...)..."
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B232E] dark:text-[#FFF4E9] uppercase mb-1">Physical Copy Condition on Return *</label>
              <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="GOOD">GOOD — ₹0 condition fine (Copy returns to available circulation)</option>
                <option value="DAMAGED">DAMAGED — ₹50 condition fine (Copy marked as DAMAGED)</option>
                <option value="LOST">LOST — ₹100 condition fine (Copy marked as LOST)</option>
              </Select>
              
              {/* Explanatory Fine Preview */}
              <div className="mt-2 text-[11px] p-2.5 rounded-lg border bg-[#E8DBC5]/30 dark:bg-[#2A222B]/60 border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] text-[#2B232E] dark:text-[#FFF4E9] flex items-center justify-between font-medium">
                <span>
                  Selected: <strong className="uppercase font-bold text-[#8D6B94] dark:text-[#B185A7]">{condition}</strong>
                </span>
                <span className="font-mono font-bold text-[#8D6B94] dark:text-[#B185A7]">
                  {condition === 'GOOD' && '₹0 condition fine • Copy returns to available circulation'}
                  {condition === 'DAMAGED' && '₹50 condition fine • Copy marked as DAMAGED'}
                  {condition === 'LOST' && '₹100 condition fine • Copy marked as LOST'}
                </span>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] font-bold" isLoading={loading}>
              <ArrowDownLeft className="w-5 h-5 mr-2" /> Process Return & Calculate Fine
            </Button>
          </form>

          {errorMsg && (
            <Alert variant="destructive">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Return Operation Failed</span>
              </div>
              <p className="text-xs">{errorMsg}</p>
            </Alert>
          )}

          {returnResult && (
            <Alert variant={returnResult.totalFine > 0 ? 'warning' : 'success'} className="space-y-3 p-5 border-2 shadow-xs">
              <div className="flex items-center justify-between border-b border-current/15 pb-3">
                <div className="flex items-center space-x-2 font-extrabold text-base text-[#2B232E] dark:text-[#FFF4E9]">
                  <CheckCircle2 className="w-5 h-5 text-[#8D6B94] shrink-0" />
                  <span>Book Return Successful</span>
                </div>
                <Badge variant={returnResult.totalFine > 0 ? 'important' : 'selected'} className="font-bold">
                  {returnResult.totalFine > 0 ? `TOTAL FINE: ₹${returnResult.totalFine}` : 'NO FINE CHARGED'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#7A697E] dark:text-[#D1C2D4] block text-[10px] uppercase font-bold">Borrower ID</span>
                  <span className="font-mono font-bold text-[#2B232E] dark:text-[#FFF4E9] text-sm">{formatRollNumber(returnResult.userIdentifier || returnResult.rollNumber || rollNumber)}</span>
                </div>
                <div>
                  <span className="text-[#7A697E] dark:text-[#D1C2D4] block text-[10px] uppercase font-bold">Book Title & ID</span>
                  <span className="font-bold text-[#2B232E] dark:text-[#FFF4E9] block">{returnResult.bookTitle || 'Borrowed Book'}</span>
                  {returnResult.bookId && <span className="font-mono text-[10px] text-slate-500 block">ID: {returnResult.bookId}</span>}
                </div>
                <div>
                  <span className="text-[#7A697E] dark:text-[#D1C2D4] block text-[10px] uppercase font-bold">Return Condition</span>
                  <Badge variant={returnResult.condition === 'GOOD' ? 'normal' : 'important'} className="font-bold mt-0.5">
                    {returnResult.condition || returnResult.conditionOnReturn}
                  </Badge>
                </div>
                <div>
                  <span className="text-[#7A697E] dark:text-[#D1C2D4] block text-[10px] uppercase font-bold">Return Date</span>
                  <span className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">{new Date(returnResult.returnDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[#7A697E] dark:text-[#D1C2D4] block text-[10px] uppercase font-bold">Overdue Fine ({returnResult.overdueDays || 0} days late)</span>
                  <span className="font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">₹{returnResult.overdueFine || 0}</span>
                </div>
                <div>
                  <span className="text-[#7A697E] dark:text-[#D1C2D4] block text-[10px] uppercase font-bold">Condition Fine ({returnResult.condition || returnResult.conditionOnReturn})</span>
                  <span className="font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">₹{returnResult.conditionFine || 0}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-current/10 flex items-center justify-between">
                  <div>
                    <span className="text-[#7A697E] dark:text-[#D1C2D4] block text-[10px] uppercase font-bold">Total Fine Amount</span>
                    <strong className="text-lg font-black text-[#8D6B94] dark:text-[#B185A7]">
                      ₹{returnResult.totalFine ?? returnResult.fineAmount ?? 0}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#7A697E] dark:text-[#D1C2D4] block text-[10px] uppercase font-bold text-right">Fine Status</span>
                    <Badge variant={returnResult.fineStatus === 'PAID' ? 'selected' : 'important'} className="font-extrabold">
                      {returnResult.fineStatus || (returnResult.totalFine > 0 ? 'PENDING' : 'NONE')}
                    </Badge>
                  </div>
                </div>
                {returnResult.availableCopies !== undefined && (
                  <div className="col-span-2 pt-2 border-t border-current/10 flex items-center justify-between text-xs">
                    <span className="text-[#7A697E] dark:text-[#D1C2D4] font-bold">Updated Inventory Availability:</span>
                    <strong className="text-[#8D6B94] font-mono">
                      Copies: {returnResult.availableCopies}/{returnResult.totalCopies} ({returnResult.issuedCopies} issued, {returnResult.damagedCopies || 0} damaged, {returnResult.lostCopies || 0} lost)
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
