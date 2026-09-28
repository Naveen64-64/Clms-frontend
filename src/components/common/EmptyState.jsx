import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../ui/Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-[#C5C6C7]/30 dark:border-[#C5C6C7]/15 rounded-2xl bg-[#F0F4F8]/50 dark:bg-[#1F2833]/40 my-4">
      <div className="p-3.5 bg-white dark:bg-[#1F2833] rounded-2xl border border-[#C5C6C7]/30 dark:border-[#C5C6C7]/18 shadow-sm mb-3.5">
        <Icon className="h-7 w-7 text-[#009F9A] dark:text-[#66FCF1]" />
      </div>
      <h3 className="text-base font-bold text-[#1F2833] dark:text-[#FFFFFF]">{title}</h3>
      <p className="mt-1 text-sm text-[#6C7A89] dark:text-[#C5C6C7] max-w-sm">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="mt-4" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

