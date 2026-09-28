import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ className, children, ...props }) => (
  <div className={cn('rounded-xl border border-[#E8DBC5] dark:border-[rgba(255,244,233,0.10)] bg-white dark:bg-[#302731] text-[#2B232E] dark:text-[#FFF4E9] shadow-[0_4px_20px_rgba(141,107,148,0.06)] transition-all', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6 border-b border-[#E8DBC5]/60 dark:border-[rgba(255,244,233,0.08)]', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-[#2B232E] dark:text-[#FFF4E9]', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-[#7A697E] dark:text-[#D1C2D4]', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn('p-6 pt-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('flex items-center p-6 pt-0 border-t border-[#E8DBC5]/60 dark:border-[rgba(255,244,233,0.08)] mt-4', className)} {...props}>
    {children}
  </div>
);
