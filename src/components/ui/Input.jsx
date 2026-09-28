import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-[42px] w-full rounded-xl border border-[#E8DBC5] dark:border-[rgba(255,244,233,0.12)] bg-white dark:bg-[#2A222B] px-3.5 text-sm font-medium text-[#2B232E] dark:text-[#FFF4E9] placeholder:text-[#8D6B94]/70 dark:placeholder:text-[#B185A7]/80 placeholder:font-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6B94]/30 focus:border-[#8D6B94] dark:focus:border-[#B185A7] hover:border-[#C3A29E] dark:hover:border-[#B185A7]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-2xs',
          error && 'border-[#C3A29E] dark:border-[#C3A29E] focus:ring-[#C3A29E]/20 focus:border-[#C3A29E]',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[#C3A29E] font-semibold">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
