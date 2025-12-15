/**
 * Tooltip Component
 * 
 * Provides contextual information on hover.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProviderProps {
  children: React.ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function TooltipTrigger({ children, asChild, className }: TooltipTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn('cursor-help', className, children.props.className),
    } as React.HTMLAttributes<HTMLElement>);
  }
  return <span className={cn('cursor-help', className)}>{children}</span>;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

export function TooltipContent({ 
  children, 
  className,
  side = 'top',
  sideOffset = 4 
}: TooltipContentProps) {
  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={cn(
        'absolute z-50 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-950 shadow-md',
        'dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
        'pointer-events-none opacity-0 transition-opacity group-hover:opacity-100',
        sideClasses[side],
        className
      )}
      style={{ marginTop: side === 'bottom' ? sideOffset : undefined, marginBottom: side === 'top' ? sideOffset : undefined }}
    >
      {children}
    </div>
  );
}
