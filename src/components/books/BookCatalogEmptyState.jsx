import React from 'react';
import { BookOpen, Sparkles, Library } from 'lucide-react';

export const BookCatalogEmptyState = ({ title, description }) => {
  return (
    <div className="bg-gradient-to-b from-[#E8DBC5]/30 dark:from-[#302731]/40 via-slate-50/50 dark:via-slate-900/50 to-white dark:to-slate-900 border border-[#E8DBC5]/80 dark:border-[#3B3142] rounded-2xl p-8 sm:p-10 text-center max-w-xl mx-auto shadow-xs space-y-4 my-2">
      {/* Subtle Floating Book Icon Container */}
      <div className="relative flex items-center justify-center">
        {/* Soft Pulse Background Ring */}
        <div className="absolute w-28 h-28 rounded-full bg-[#E8DBC5]/70 dark:bg-[#302731]/50 animate-pulse pointer-events-none" />
        
        {/* Animated Floating Book Badge */}
        <div className="relative z-10 p-4 bg-white dark:bg-slate-800 border border-[#E8DBC5] dark:border-[#3B3142] rounded-2xl shadow-sm transition-transform duration-500 ease-in-out hover:scale-105">
          <div className="flex items-center space-x-2 text-[#8D6B94] dark:text-[#B185A7]">
            <Library className="w-9 h-9 stroke-[1.75]" />
            <BookOpen className="w-7 h-7 stroke-[2] text-[#8D6B94] dark:text-[#B185A7]" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 p-1 bg-amber-400 text-white rounded-full shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>
      </div>

      {/* Primary Guidance Text */}
      <div className="space-y-1.5">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title || 'Search the Library Catalog'}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto font-medium">
          {description || 'Enter a Book ID, title, author, ISBN, or category above to search available repository holdings.'}
        </p>
      </div>

      {/* Feature Hint Chips */}
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-[#8D6B94] dark:text-[#B185A7] border border-[#E8DBC5] dark:border-[#3B3142] shadow-xs">
          💡 Tip: Search by Author or Subject
        </span>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-[#8D6B94] dark:text-[#B185A7] border border-[#E8DBC5] dark:border-[#3B3142] shadow-xs">
          🔑 Search by Book ID
        </span>
      </div>
    </div>
  );
};
