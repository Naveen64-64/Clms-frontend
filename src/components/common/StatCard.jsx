import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  badgeText,
  badgeVariant = 'default',
  color = 'lavender',
  onClick,
  to,
  actionHint,
  className
}) => {
  const navigate = useNavigate();
  const isClickable = Boolean(onClick || to);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e);
    }
  };

  const colorStyles = {
    lavender: 'bg-[#8D6B94]/15 text-[#8D6B94] dark:bg-[#8D6B94]/25 dark:text-[#FFF4E9] border-[#8D6B94]/30',
    indigo: 'bg-[#8D6B94]/15 text-[#8D6B94] dark:bg-[#8D6B94]/25 dark:text-[#FFF4E9] border-[#8D6B94]/30',
    amethyst: 'bg-[#B185A7]/20 text-[#8D6B94] dark:bg-[#B185A7]/30 dark:text-[#FFF4E9] border-[#B185A7]/30',
    purple: 'bg-[#B185A7]/20 text-[#8D6B94] dark:bg-[#B185A7]/30 dark:text-[#FFF4E9] border-[#B185A7]/30',
    rosy: 'bg-[#C3A29E]/25 text-[#8D6B94] dark:bg-[#C3A29E]/30 dark:text-[#FFF4E9] border-[#C3A29E]/40',
    accent: 'bg-[#C3A29E]/25 text-[#8D6B94] dark:bg-[#C3A29E]/30 dark:text-[#FFF4E9] border-[#C3A29E]/40',
    sand: 'bg-[#E8DBC5] text-[#8D6B94] dark:bg-[#302731] dark:text-[#E8DBC5] border-[#E8DBC5]',
    emerald: 'bg-[#8D6B94]/15 text-[#8D6B94] dark:bg-[#8D6B94]/25 dark:text-[#FFF4E9] border-[#8D6B94]/30',
    amber: 'bg-[#C3A29E]/25 text-[#8D6B94] dark:bg-[#C3A29E]/30 dark:text-[#FFF4E9] border-[#C3A29E]/40',
    rose: 'bg-[#C3A29E] text-[#FFF4E9] border-[#C3A29E]',
    sky: 'bg-[#E8DBC5] text-[#8D6B94] dark:bg-[#302731] dark:text-[#E8DBC5] border-[#E8DBC5]',
    cyan: 'bg-[#E8DBC5] text-[#8D6B94] dark:bg-[#302731] dark:text-[#E8DBC5] border-[#E8DBC5]',
  };

  return (
    <Card
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={cn(
        'transition-all duration-200 relative select-none',
        isClickable
          ? 'cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 hover:border-[#8D6B94]/50 dark:hover:border-[#B185A7]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6B94]'
          : 'hover:shadow-md',
        className
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD] truncate">
                {title}
              </p>
              {isClickable && (
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#B185A7] opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-1.5 sm:space-x-2 mt-1">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2B232E] dark:text-[#FFF4E9]">
                {value}
              </h3>
              {badgeText && (
                <span
                  className={`inline-flex items-center text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
                    colorStyles[color] || colorStyles.lavender
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </div>
            {description && (
              <p className="text-[11px] sm:text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1 truncate">
                {description}
              </p>
            )}
            {isClickable && actionHint && (
              <p className="text-[10px] font-semibold text-[#8D6B94] dark:text-[#B185A7] mt-1.5 opacity-80 group-hover:opacity-100 flex items-center gap-1">
                <span>{actionHint}</span>
                <span>→</span>
              </p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'p-2.5 sm:p-3 rounded-xl border shrink-0 transition-transform duration-200',
                isClickable && 'group-hover:scale-105',
                colorStyles[color] || colorStyles.lavender
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
