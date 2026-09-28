import React, { useState, useEffect } from 'react';
import { facultyApi } from '../../api/facultyApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { DollarSign } from 'lucide-react';

export const FacultyFines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyApi.getFines()
      .then((res) => {
        if (res?.data) setFines(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = fines.filter(f => !f.finePaid).reduce((sum, f) => sum + (f.fineAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Faculty Fines Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Library overdue or condition fine statements</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center space-x-3 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Outstanding Total:</span>
          <span className="text-lg font-black text-slate-900 dark:text-white">₹{totalOutstanding}</span>
        </div>
      </div>

      <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Fine Statement Log</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : fines.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No Library Fines"
              description="You have no outstanding or historical library fines."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Library</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="font-bold text-slate-900 dark:text-white">
                      {tx.masterBook?.title || tx.bookCopy?.book?.title || 'Library Item'}
                    </TableCell>
                    <TableCell className="text-xs">{tx.library?.name || 'Central Library'}</TableCell>
                    <TableCell className="text-xs">{new Date(tx.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={tx.conditionOnReturn === 'GOOD' ? 'success' : 'danger'} className="text-[10px]">
                        {tx.conditionOnReturn || 'GOOD'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                      ₹{tx.fineAmount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.finePaid ? 'success' : 'danger'}>
                        {tx.finePaid ? 'PAID' : 'PENDING'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
