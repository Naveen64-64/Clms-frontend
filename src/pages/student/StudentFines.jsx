import React, { useState, useEffect } from 'react';
import { fineApi } from '../../api/fineApi';
import { settingsApi } from '../../api/settingsApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { DollarSign, Clock, FileText } from 'lucide-react';

export const StudentFines = () => {
  const [fines, setFines] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    Promise.allSettled([fineApi.getFineHistory(), settingsApi.getSettings()])
      .then(([finesRes, setRes]) => {
        if (finesRes.status === 'fulfilled' && finesRes.value?.data) {
          setFines(finesRes.value.data);
        }
        if (setRes.status === 'fulfilled') {
          const sData = setRes.value?.data?.data || setRes.value?.data;
          if (sData) setSettings(sData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const totalUnpaid = fines
    .filter((f) => f.status === 'PENDING')
    .reduce((sum, f) => sum + (f.outstandingAmount !== undefined ? f.outstandingAmount : (f.amount || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">My Library Fines</h1>
          <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">Overdue fine transactions, condition fines, and payment breakdown</p>
        </div>
        <div className="bg-[#E8DBC5]/50 dark:bg-[#2D2534] border border-[#C3A29E] dark:border-[#3B3142] px-4 py-2 rounded-xl text-right">
          <span className="text-xs text-[#8D6B94] dark:text-[#B185A7] font-semibold block uppercase tracking-wider">Total Outstanding Fine</span>
          <strong className="text-xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">₹{totalUnpaid}</strong>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">Fine Transactions ({fines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : fines.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No Fine Records"
              description="You have no overdue or condition fines on your library account."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book & ID</TableHead>
                  <TableHead>Dates (Issue / Due / Return)</TableHead>
                  <TableHead>Overdue Fine</TableHead>
                  <TableHead>Condition Fine</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((f) => {
                  const bTx = f.borrowTransaction || {};
                  const book = bTx.bookCopy?.book || {};
                  const issueStr = bTx.issueDate ? new Date(bTx.issueDate).toLocaleDateString() : '—';
                  const dueStr = bTx.dueDate ? new Date(bTx.dueDate).toLocaleDateString() : '—';
                  const retStr = bTx.returnDate ? new Date(bTx.returnDate).toLocaleDateString() : 'Pending Return';
                  const condition = bTx.conditionOnReturn || 'GOOD';
                  
                  let overdueDays = 0;
                  if (bTx.dueDate && (bTx.returnDate || f.createdAt)) {
                    const end = bTx.returnDate ? new Date(bTx.returnDate) : new Date();
                    if (end > new Date(bTx.dueDate)) {
                      overdueDays = Math.ceil(Math.abs(end - new Date(bTx.dueDate)) / (1000 * 60 * 60 * 24));
                    }
                  }

                  const fineRate = Number(settings?.fineRatePerOverdueDay ?? settings?.finePerDay ?? 1);
                  const overdueFine = f.overdueFine ?? bTx.overdueFine ?? (overdueDays * fineRate);
                  const conditionFine = f.conditionFine ?? bTx.conditionFine ?? (condition === 'DAMAGED' ? 50 : condition === 'LOST' ? 100 : 0);
                  const orig = f.originalAmount !== undefined ? f.originalAmount : f.amount;
                  const paid = f.paidAmount || 0;
                  const out = f.outstandingAmount !== undefined ? f.outstandingAmount : (f.status === 'PAID' ? 0 : Math.max(0, orig - paid));

                  return (
                    <React.Fragment key={f._id}>
                      <TableRow>
                        <TableCell>
                          <div className="font-bold text-[#2B232E] dark:text-[#FFF4E9]">{book.title || 'Library Book'}</div>
                          <div className="font-mono text-[10px] text-[#7A697E] dark:text-[#B8A6BD]">ID: {book._id || bTx.bookCopy?._id || '—'}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>Issue: <span className="font-medium text-[#2B232E] dark:text-[#FFF4E9]">{issueStr}</span></div>
                          <div>Due: <span className="font-medium text-[#2B232E] dark:text-[#FFF4E9]">{dueStr}</span></div>
                          <div>Return: <span className="font-medium text-[#2B232E] dark:text-[#FFF4E9]">{retStr}</span></div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">₹{overdueFine}</div>
                          <div className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD]">({overdueDays} overdue day{overdueDays !== 1 ? 's' : ''})</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">₹{conditionFine}</div>
                          <Badge variant={condition === 'GOOD' ? 'sand' : 'danger'} className="text-[10px] py-0 px-1 mt-0.5 font-bold">
                            {condition}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[#2B232E] dark:text-[#FFF4E9]">₹{orig}</TableCell>
                        <TableCell className="font-semibold text-emerald-700 dark:text-emerald-400">₹{paid}</TableCell>
                        <TableCell className="font-extrabold text-[#2B232E] dark:text-[#FFF4E9] text-sm">₹{out}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              f.status === 'PAID'
                                ? 'sand'
                                : f.status === 'WAIVED'
                                ? 'info'
                                : 'warning'
                            }
                            className="font-bold"
                          >
                            {f.status}
                          </Badge>
                          {f.payments?.length > 0 && (
                            <div className="mt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-5 px-1 text-[#8D6B94] dark:text-[#B185A7]"
                                onClick={() => setExpandedId(expandedId === f._id ? null : f._id)}
                              >
                                <Clock className="w-3 h-3 mr-0.5" /> {f.payments.length} payment(s)
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Payment History Sub-row */}
                      {expandedId === f._id && f.payments?.length > 0 && (
                        <TableRow className="bg-[#FFF4E9]/60 dark:bg-[#1D1722]">
                          <TableCell colSpan={8} className="p-3">
                            <div className="space-y-1.5 max-w-lg">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD] flex items-center gap-1">
                                <FileText className="w-3 h-3 text-[#8D6B94] dark:text-[#B185A7]" /> Payment Log Details
                              </span>
                              <div className="border dark:border-[#3B3142] rounded bg-white dark:bg-[#211C26] divide-y divide-[#E8DBC5]/60 dark:divide-[#3B3142] text-xs">
                                {f.payments.map((p, idx) => (
                                  <div key={idx} className="p-2 flex justify-between items-center text-[11px]">
                                    <div>
                                      <strong className="text-emerald-700 dark:text-emerald-400">Paid ₹{p.amount}</strong> via {p.paymentMethod}
                                      <div className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD]">Remaining: ₹{p.remainingOutstanding}</div>
                                    </div>
                                    <div className="text-right text-[10px] text-[#7A697E] dark:text-[#B8A6BD]">
                                      {new Date(p.createdAt).toLocaleString()}
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
    </div>
  );
};
