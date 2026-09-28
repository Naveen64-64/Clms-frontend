import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = ({ children, content, side = 'right', align = 'center', delayDuration = 100, className }) => {
  if (!content) return children;

  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={8}
          className={cn(
            'z-50 overflow-hidden rounded-lg bg-[#2B232E] px-3 py-1.5 text-xs font-medium text-[#FFF4E9] shadow-lg border border-[#8D6B94]/30',
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[#2B232E]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};
