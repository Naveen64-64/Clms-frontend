import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Copy, Check, ArrowUpRight, BookOpen, Layers, Library } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BookDetailsDialog = ({ open, onOpenChange, book, mode = 'public' }) => {
  const [copied, setCopied] = useState(false);

  if (!book) return null;

  const bookIdStr = book.id || book._id;
  const isAvailable = book.availableCopies > 0;
  const totalCopies = book.totalCopies || 0;
  const availableCopies = book.availableCopies || 0;

  const handleCopyId = () => {
    if (!bookIdStr) return;
    navigator.clipboard.writeText(bookIdStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
              {book.branch || 'GENERAL'}
            </Badge>
            <Badge
              variant={isAvailable ? 'success' : totalCopies > 0 ? 'warning' : 'danger'}
              className="font-bold text-[10px]"
            >
              {isAvailable ? `AVAILABLE (${availableCopies}/${totalCopies} Free)` : totalCopies > 0 ? 'ALL ISSUED' : 'UNAVAILABLE'}
            </Badge>
          </div>

          <DialogTitle className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {book.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Authored by <strong className="text-slate-900 dark:text-slate-200 font-bold">{book.author}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Structured Sections */}
        <div className="space-y-4 sm:space-y-6 text-xs">
          {/* SECTION 1: Master Book Identification */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#B185A7]" />
              Book Identification
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Book ID</span>
                <span className="font-mono text-sm font-extrabold text-[#8D6B94] dark:text-[#B185A7] select-all truncate block">
                  {bookIdStr || 'N/A'}
                </span>
                {book.callNo && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                    Call No: {book.callNo}
                  </span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyId}
                className="h-8 text-xs font-semibold gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs w-full sm:w-auto shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                {copied ? 'Copied!' : 'Copy Book ID'}
              </Button>
            </div>
          </div>


          {/* SECTION 2: Book Metadata Details */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#B185A7]" />
              Book Information
            </span>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Category</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{book.category || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">ISBN Identifier</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 text-xs font-bold">{book.isbn || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Publisher</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{book.publisher || 'KIET Academic Press'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Edition</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{book.edition || 'Standard Edition'}</span>
              </div>
            </div>

            {book.description && (
              <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mt-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Description</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal text-xs">{book.description}</p>
              </div>
            )}
          </div>

          {/* SECTION 3: Physical Copy Inventory Breakdown */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Physical Copy Breakdown
            </span>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Total Copies</span>
                <strong className="text-base font-extrabold text-slate-900 dark:text-white">{book.totalCopies || 0}</strong>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Available</span>
                <strong className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">{book.availableCopies || 0}</strong>
              </div>
              <div className="p-2.5 bg-[#E8DBC5]/40 dark:bg-sky-950/60 rounded-xl border border-sky-200 dark:border-sky-900/50">
                <span className="text-[10px] font-bold text-sky-700 dark:text-[#B185A7] uppercase block">Issued</span>
                <strong className="text-base font-extrabold text-sky-700 dark:text-sky-300">{book.issuedCopies || 0}</strong>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">Damaged</span>
                <strong className="text-base font-extrabold text-amber-700 dark:text-amber-300">{book.damagedCopies || 0}</strong>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-900/50">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase block">Lost</span>
                <strong className="text-base font-extrabold text-rose-700 dark:text-rose-300">{book.lostCopies || 0}</strong>
              </div>
            </div>
          </div>

          {/* SECTION 4: Institutional Library Holdings Distribution */}
          {book.libraryDistribution && book.libraryDistribution.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#B185A7]" />
                Institutional Library Distribution
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                {book.libraryDistribution.map((dist) => (
                  <div key={dist.code} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{dist.libraryName || dist.code}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Code: {dist.code}</div>
                    </div>
                    <Badge variant={dist.available > 0 ? 'success' : 'secondary'} className="font-bold text-xs">
                      {dist.available} Available / {dist.total} Total
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff Quick Action Button */}
          {mode === 'librarian' && isAvailable && (
            <div className="pt-2">
              <Link to="/librarian/issue" state={{ prefilledBookId: bookIdStr }}>
                <Button className="w-full bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold text-xs cursor-pointer h-10 shadow-xs">
                  <ArrowUpRight className="w-4 h-4 mr-1.5" /> Proceed to Issue Book
                </Button>
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
