'use client';

import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  rowSpan?: 1 | 2 | 3 | 4;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const colSpanClasses = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
};

const rowSpanClasses = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
};

export function BentoGrid({
  children,
  className,
  columns = 3,
  gap = 'md',
}: BentoGridProps) {
  // Tailwind doesn't support dynamic class names, so we use inline styles
  const gridColsClass = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  };

  return (
    <div
      className={cn(
        'grid w-full grid-cols-1',
        gridColsClass[columns],
        gapClasses[gap],
        'max-w-full',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}: BentoGridItemProps) {
  return (
    <div
      className={cn(
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        'min-h-[200px]',
        'w-full',
        'overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}
