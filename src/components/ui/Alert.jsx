import React from 'react';
import { cn } from '../../lib/utils';

export const Alert = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-[#E8DBC5]/50 dark:bg-[#2D2534] text-[#8D6B94] dark:text-[#E8DBC5] border-[#C3A29E] dark:border-[#3B3142]',
    info: 'bg-[#E8DBC5]/40 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    destructive: 'bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800',
  };

  return (
    <div
      role="alert"
      className={cn('relative w-full rounded-lg border p-4 text-sm font-medium transition-all', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};
