import React, { useState, useEffect } from 'react';
import { facultyApi } from '../../api/facultyApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { BookMarked } from 'lucide-react';

export const FacultyHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyApi.getBorrowings()
      .then((res) => {
        if (res?.data) setHistory(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Faculty Borrowing History</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Complete record of current and returned library loans across all campuses</p>
      </div>

      <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Transaction Log</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : history.length === 0 ? (
            <EmptyState
              icon={BookMarked}
              title="No Borrowing History"
              description="You have not borrowed any books from the college libraries yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Copy ID</TableHead>
                  <TableHead>Library</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="font-bold text-slate-900 dark:text-white">
                      <div>{tx.masterBook?.title || tx.bookCopy?.book?.title || 'Master Book'}</div>
                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">Book ID: {tx.masterBook?._id || tx.bookCopy?.book?._id || '—'}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tx.bookCopy?.barcode || '—'}</TableCell>
                    <TableCell className="text-xs">{tx.library?.name || 'Central Library'}</TableCell>
                    <TableCell className="text-xs">{new Date(tx.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{new Date(tx.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-xs">
                      {tx.conditionOnReturn ? (
                        <Badge variant={tx.conditionOnReturn === 'GOOD' ? 'success' : 'danger'} className="text-[10px] py-0 font-bold">
                          {tx.conditionOnReturn}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                      {tx.fineAmount > 0 ? `₹${tx.fineAmount}` : '₹0'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === 'RETURNED'
                            ? 'success'
                            : tx.status === 'OVERDUE'
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {tx.status}
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
