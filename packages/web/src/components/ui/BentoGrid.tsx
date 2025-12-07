"use client";

import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg" | "xl";
}

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  rowSpan?: 1 | 2 | 3 | 4;
}

const gapClasses = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export function BentoGrid({ children, className, columns = 3, gap = "md" }: BentoGridProps) {
  // Tailwind doesn't support dynamic class names, so we use inline styles
  const gridColsClass = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  };

  return (
    <div
      className={cn(
        "grid w-full grid-cols-1",
        gridColsClass[columns],
        gapClasses[gap],
        "max-w-full",
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
        // Mobile: always span 1 column
        "col-span-1",
        // Desktop: apply colSpan
        colSpan === 2 && "md:col-span-2",
        colSpan === 3 && "md:col-span-3",
        colSpan === 4 && "md:col-span-4",
        colSpan === 5 && "md:col-span-5",
        colSpan === 6 && "md:col-span-6",
        // Row span (only on desktop)
        rowSpan === 1 && "md:row-span-1",
        rowSpan === 2 && "md:row-span-2",
        rowSpan === 3 && "md:row-span-3",
        rowSpan === 4 && "md:row-span-4",
        "min-h-[200px]",
        "w-full",
        "overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
