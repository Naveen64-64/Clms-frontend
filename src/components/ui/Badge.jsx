import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-[#E8DBC5] text-[#8D6B94] dark:bg-[#302731] dark:text-[#E8DBC5] border-[#E8DBC5]/50 dark:border-[rgba(255,244,233,0.1)]',
    normal: 'bg-[#E8DBC5] text-[#8D6B94] dark:bg-[#302731] dark:text-[#E8DBC5] border-[#E8DBC5]/50 dark:border-[rgba(255,244,233,0.1)]',
    important: 'bg-[#B185A7] text-[#FFF4E9] border-[#B185A7]',
    selected: 'bg-[#8D6B94] text-[#FFF4E9] border-[#8D6B94]',
    lavender: 'bg-[#8D6B94] text-[#FFF4E9] border-[#8D6B94]',
    amethyst: 'bg-[#B185A7] text-[#FFF4E9] border-[#B185A7]',
    secondary: 'bg-[#B185A7]/20 text-[#8D6B94] dark:bg-[#B185A7]/30 dark:text-[#B185A7] border-[#B185A7]/30',
    rosy: 'bg-[#C3A29E]/25 text-[#7C5A56] dark:bg-[#C3A29E]/30 dark:text-[#FFF4E9] border-[#C3A29E]/40',
    accent: 'bg-[#C3A29E] text-[#FFF4E9] border-[#C3A29E]',
    sand: 'bg-[#E8DBC5] text-[#8D6B94] dark:bg-[#302731] dark:text-[#E8DBC5] border-[#E8DBC5]',
    success: 'bg-[#8D6B94]/15 text-[#8D6B94] dark:bg-[#8D6B94]/30 dark:text-[#FFF4E9] border-[#8D6B94]/30',
    warning: 'bg-[#C3A29E]/20 text-[#8D6B94] dark:bg-[#C3A29E]/30 dark:text-[#E8DBC5] border-[#C3A29E]/40',
    danger: 'bg-[#C3A29E] text-[#FFF4E9] border-[#C3A29E]',
    info: 'bg-[#E8DBC5] text-[#8D6B94] border-[#E8DBC5]',
    outline: 'bg-transparent text-[#8D6B94] dark:text-[#B185A7] border-[#8D6B94] dark:border-[#B185A7]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
