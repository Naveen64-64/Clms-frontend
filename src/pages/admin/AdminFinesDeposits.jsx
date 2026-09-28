import React, { useState, useEffect } from 'react';
import { fineApi } from '../../api/fineApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Search, DollarSign } from 'lucide-react';

export default function AdminFinesDeposits() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFines();
  }, [search]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await fineApi.getFineHistory(search ? { rollNumber: search } : {});
      if (res.data?.success || res.data) {
        setFines(res.data.data?.fines || res.data.data || res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Global Fine Collections Audit</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Institutional financial audit and fine collection history.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by student roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Fine Collection History ({fines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Roll</TableHead>
                <TableHead>Book Title</TableHead>
                <TableHead>Breakdown</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Collected By</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500 dark:text-slate-400">Loading fine collections...</TableCell>
                </TableRow>
              ) : fines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500 dark:text-slate-400">No fine records found.</TableCell>
                </TableRow>
              ) : (
                fines.map((fn) => {
                  const bTx = fn.borrowTransaction || {};
                  const ov = fn.overdueFine ?? bTx.overdueFine ?? 0;
                  const cond = fn.conditionFine ?? bTx.conditionFine ?? 0;
                  const condLabel = bTx.conditionOnReturn || (cond === 50 ? 'DAMAGED' : cond === 100 ? 'LOST' : 'GOOD');

                  return (
                    <TableRow key={fn._id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{fn.student?.rollNumber || fn.rollNumber}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900 dark:text-white">{bTx.bookCopy?.book?.title || 'Library Book'}</TableCell>
                      <TableCell className="text-xs">
                        {ov > 0 && <div>Overdue: ₹{ov}</div>}
                        {cond > 0 && <div className="font-bold text-rose-600 dark:text-rose-400">{condLabel}: ₹{cond}</div>}
                        {ov === 0 && cond === 0 && <div>₹{fn.amount}</div>}
                      </TableCell>
                      <TableCell className="font-extrabold text-rose-600 dark:text-rose-400">₹{fn.amount}</TableCell>
                      <TableCell className="text-xs">{fn.collectedBy?.username || fn.collectedBy || 'System'}</TableCell>
                      <TableCell className="text-xs">{fn.paymentMethod || 'CASH'}</TableCell>
                      <TableCell className="text-xs">{new Date(fn.createdAt || fn.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={fn.status === 'PAID' ? 'success' : fn.status === 'WAIVED' ? 'info' : 'warning'}>
                          {fn.status || 'PAID'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
