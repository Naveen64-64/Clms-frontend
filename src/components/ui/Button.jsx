import React from 'react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', disabled, isLoading, children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#8D6B94] text-[#FFF4E9] hover:bg-[#B185A7] shadow-[0_4px_14px_rgba(141,107,148,0.25)] focus:ring-[#8D6B94] font-semibold',
      secondary: 'bg-[#E8DBC5] text-[#8D6B94] hover:bg-[#C3A29E] hover:text-[#FFF4E9] dark:bg-[#302731] dark:text-[#E8DBC5] dark:hover:bg-[#B185A7] dark:hover:text-[#FFF4E9] font-semibold',
      accent: 'bg-[#C3A29E] text-[#FFF4E9] hover:bg-[#B185A7] font-semibold shadow-xs',
      sand: 'bg-[#E8DBC5] text-[#8D6B94] hover:bg-[#C3A29E] hover:text-[#FFF4E9] font-semibold',
      outline: 'bg-transparent border border-[#8D6B94] text-[#8D6B94] hover:bg-[#E8DBC5]/50 dark:border-[#B185A7] dark:text-[#B185A7] dark:hover:bg-[#302731]',
      destructive: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] dark:bg-[#DC2626] dark:hover:bg-[#B91C1C] shadow-xs font-semibold focus:ring-[#DC2626]',
      ghost: 'bg-transparent text-[#8D6B94] dark:text-[#B185A7] hover:bg-[#E8DBC5]/40 dark:hover:bg-[#302731]',
      link: 'text-[#8D6B94] dark:text-[#B185A7] underline-offset-4 hover:underline p-0 h-auto font-semibold',
    };

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs rounded-md',
      lg: 'h-11 px-6 text-base rounded-md',
      icon: 'h-9 w-9 p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer',
          variants[variant] || variants.default,
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
