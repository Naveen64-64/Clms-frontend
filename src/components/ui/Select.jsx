import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({ className, children, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          'flex h-[42px] w-full appearance-none rounded-xl border border-[#E8DBC5] dark:border-[rgba(255,244,233,0.12)] bg-white dark:bg-[#2A222B] px-3.5 pr-9 text-sm font-medium text-[#2B232E] dark:text-[#FFF4E9] focus:outline-none focus:ring-2 focus:ring-[#8D6B94]/30 focus:border-[#8D6B94] dark:focus:border-[#B185A7] hover:border-[#C3A29E] dark:hover:border-[#B185A7]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer shadow-2xs',
          error && 'border-[#C3A29E] dark:border-[#C3A29E] focus:ring-[#C3A29E]/20 focus:border-[#C3A29E]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D6B94] dark:text-[#B185A7]" />
      {error && <p className="mt-1 text-xs text-[#C3A29E] font-semibold">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
