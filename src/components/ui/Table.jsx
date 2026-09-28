import React from 'react';
import { cn } from '../../lib/utils';

export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full max-w-full overflow-x-auto rounded-xl border border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] -webkit-overflow-scrolling-touch">
    <table ref={ref} className={cn('w-full caption-bottom text-xs sm:text-sm', className)} {...props} />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-[#E8DBC5]/50 dark:bg-[#2A222B] [&_tr]:border-b border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)]', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('border-b border-[#E8DBC5]/60 dark:border-[rgba(255,244,233,0.08)] transition-colors hover:bg-[#FFF4E9]/60 dark:hover:bg-[#302731]/70 data-[state=selected]:bg-[#E8DBC5]/50 dark:data-[state=selected]:bg-[#302731]', className)}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn('h-10 sm:h-11 px-3 sm:px-4 text-left align-middle font-semibold text-[#8D6B94] dark:text-[#B185A7] text-xs sm:text-sm whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-3 sm:p-4 align-middle text-[#2B232E] dark:text-[#FFF4E9] text-xs sm:text-sm [&:has([role=checkbox])]:pr-0', className)} {...props} />
));
TableCell.displayName = 'TableCell';
