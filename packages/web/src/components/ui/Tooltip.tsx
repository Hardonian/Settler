'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded shadow-lg whitespace-nowrap',
            side === 'top' && 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            side === 'bottom' && 'top-full left-1/2 transform -translate-x-1/2 mt-2',
            side === 'left' && 'right-full top-1/2 transform -translate-y-1/2 mr-2',
            side === 'right' && 'left-full top-1/2 transform -translate-y-1/2 ml-2',
            className
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-slate-900 dark:bg-slate-800 transform rotate-45',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 translate-x-1/2',
            )}
          />
        </div>
      )}
    </div>
  );
}
