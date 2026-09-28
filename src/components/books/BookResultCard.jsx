import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Copy, Check, Info, BookOpen, MapPin } from 'lucide-react';

export const BookResultRow = ({ book, onViewDetails }) => {
  const [copied, setCopied] = useState(false);

  const bookIdStr = String(book.bookId || book.id || book._id || '');
  const isAvailable = book.availableCopies > 0;
  const totalCopies = book.totalCopies || 0;
  const availableCopies = book.availableCopies || 0;

  const handleCopyBookId = (e) => {
    e.stopPropagation();
    if (!bookIdStr) return;
    navigator.clipboard.writeText(bookIdStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-white dark:bg-[#211C26] hover:bg-[#FFF4E9]/60 dark:hover:bg-[#2D2534] transition-all duration-150 border-b border-[#E8DBC5]/60 dark:border-[#3B3142] last:border-b-0 p-3.5 sm:p-4">
      {/* Desktop Horizontal Data Row */}
      <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-4">
        {/* Column 1: BOOK (Title, Author & Branch) - 4 cols */}
        <div className="col-span-4 min-w-0">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[#E8DBC5]/50 dark:bg-[#2D2534] border border-[#C3A29E]/40 dark:border-[#3B3142] text-[#8D6B94] dark:text-[#B185A7] mt-0.5 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                onClick={() => onViewDetails(book)}
                className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9] group-hover:text-[#8D6B94] dark:group-hover:text-[#B185A7] transition-colors truncate cursor-pointer leading-snug"
                title={book.title}
              >
                {book.title}
              </h3>
              <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] font-medium truncate mt-0.5">
                By <span className="text-[#2B232E] dark:text-[#FFF4E9] font-semibold">{book.author}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: CATEGORY & BRANCH - 2 cols */}
        <div className="col-span-2 min-w-0">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#2B232E] dark:text-[#FFF4E9] block truncate">{book.category}</span>
            <Badge variant="sand" className="text-[10px] font-bold uppercase tracking-wider">
              {book.branch || 'GENERAL'}
            </Badge>
          </div>
        </div>

        {/* Column 3: LIBRARY HOLDINGS - 2 cols */}
        <div className="col-span-2 min-w-0">
          <div className="flex items-center space-x-1.5 text-xs text-[#7A697E] dark:text-[#B8A6BD] font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#B185A7] shrink-0" />
            <span className="truncate">{book.libraryName || 'KIET Library'}</span>
          </div>
        </div>

        {/* Column 4: AVAILABILITY - 2 cols */}
        <div className="col-span-2 flex flex-col items-start justify-center">
          <Badge
            variant={isAvailable ? 'sand' : totalCopies > 0 ? 'warning' : 'danger'}
            className="font-bold text-[11px] px-2 py-0.5"
          >
            {isAvailable ? `AVAILABLE (${availableCopies}/${totalCopies})` : totalCopies > 0 ? 'ALL ISSUED' : 'UNAVAILABLE'}
          </Badge>
        </div>

        {/* Column 5: BOOK ID & ACTION - 2 cols */}
        <div className="col-span-2 flex items-center justify-end space-x-2">
          {/* Book ID Badge & Copy */}
          <div className="flex items-center space-x-1 bg-[#FFF4E9]/60 dark:bg-[#2D2534] hover:bg-[#E8DBC5] dark:hover:bg-[#3B3142] px-2 py-1 rounded border border-[#E8DBC5] dark:border-[#3B3142] text-[11px] font-mono transition-colors">
            <span className="text-[#8D6B94] dark:text-[#B185A7] font-bold truncate max-w-[100px]" title={bookIdStr || 'No Book ID'}>
              {bookIdStr ? (bookIdStr.length > 10 ? `${bookIdStr.slice(0, 8)}...` : bookIdStr) : 'N/A'}
            </span>
            <button
              type="button"
              onClick={handleCopyBookId}
              title="Copy Book ID"
              className="text-[#8D6B94] hover:text-[#B185A7] dark:text-[#B185A7] dark:hover:text-white cursor-pointer p-0.5 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#B185A7]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Action Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(book)}
            className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-[#211C26] hover:bg-[#E8DBC5] dark:hover:bg-[#2D2534] text-[#2B232E] dark:text-[#FFF4E9] border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer shrink-0 transition-colors"
          >
            <Info className="w-3.5 h-3.5 mr-1 text-[#8D6B94]" />
            View
          </Button>
        </div>
      </div>

      {/* Mobile Compact Stacked Row */}
      <div className="md:hidden space-y-2.5">
        <div className="flex items-start justify-between space-x-2">
          <div className="space-y-0.5 min-w-0 flex-1">
            <h3
              onClick={() => onViewDetails(book)}
              className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9] group-hover:text-[#8D6B94] dark:group-hover:text-[#B185A7] transition-colors leading-tight cursor-pointer"
            >
              {book.title}
            </h3>
            <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] font-medium">By {book.author}</p>
          </div>
          <Badge
            variant={isAvailable ? 'sand' : totalCopies > 0 ? 'warning' : 'danger'}
            className="font-bold text-[10px] shrink-0"
          >
            {isAvailable ? `${availableCopies}/${totalCopies} Free` : 'Issued'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A697E] dark:text-[#B8A6BD] font-medium">
          <Badge variant="sand" className="text-[10px] font-bold uppercase">
            {book.branch || 'GENERAL'}
          </Badge>
          <span className="text-[#C3A29E]">•</span>
          <span className="text-[#2B232E] dark:text-[#FFF4E9]">{book.category}</span>
          <span className="text-[#C3A29E]">•</span>
          <span className="text-[#7A697E] dark:text-[#B8A6BD] flex items-center">
            <MapPin className="w-3 h-3 mr-1 text-[#8D6B94]" />
            {book.libraryName || 'KIET'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#E8DBC5]/60 dark:border-[#3B3142]">
          <div className="flex items-center space-x-1.5 bg-[#FFF4E9]/60 dark:bg-[#2D2534] px-2 py-0.5 rounded border border-[#E8DBC5] dark:border-[#3B3142] text-[10px] font-mono">
            <span className="text-[#7A697E] dark:text-[#B8A6BD]">Book ID:</span>
            <span className="font-bold text-[#8D6B94] dark:text-[#B185A7] truncate max-w-[120px]">{bookIdStr ? (bookIdStr.length > 12 ? `${bookIdStr.slice(0, 10)}...` : bookIdStr) : 'N/A'}</span>
            <button
              type="button"
              onClick={handleCopyBookId}
              title="Copy Book ID"
              className="text-[#8D6B94] hover:text-[#B185A7] dark:text-[#B185A7] cursor-pointer p-0.5"
            >
              {copied ? <Check className="w-3 h-3 text-[#8D6B94] dark:text-[#B185A7]" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(book)}
            className="text-xs font-semibold px-2.5 py-1 h-7 bg-white dark:bg-[#211C26] text-[#2B232E] dark:text-[#FFF4E9] hover:bg-[#E8DBC5] dark:hover:bg-[#2D2534] border-[#E8DBC5] dark:border-[#3B3142] cursor-pointer"
          >
            <Info className="w-3 h-3 mr-1 text-[#8D6B94]" /> View Details
          </Button>
        </div>
      </div>
    </div>
  );

};

export const BookResultCard = BookResultRow;
