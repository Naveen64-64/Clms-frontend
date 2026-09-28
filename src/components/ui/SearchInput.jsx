import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';
import { cn } from '../../lib/utils';

export const SearchInput = React.forwardRef(
  ({ value, onChange, onClear, placeholder = 'Search by keyword, title, ID...', className, ...props }, ref) => {
    return (
      <div className={cn('relative w-full', className)}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pl-10 pr-9"
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer transition-colors"
            title="Clear input"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
