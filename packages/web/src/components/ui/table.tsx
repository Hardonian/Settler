import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * Whether table has striped rows
   * @default false
   */
  striped?: boolean;
  
  /**
   * Whether table has hover effects
   * @default false
   */
  hover?: boolean;
  
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, striped = false, hover = false, size = 'default', ...props }, ref) => {
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn(
            'w-full caption-bottom text-sm',
            striped && '[&_tbody_tr:nth-child(odd)]:bg-muted/50',
            hover && '[&_tbody_tr:hover]:bg-muted/50',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
);
TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Whether row is clickable
   */
  clickable?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable = false, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors',
        clickable && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
