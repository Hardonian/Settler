import * as React from "react";
import { cn } from "@/lib/utils";

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
  size?: "sm" | "default" | "lg";

  /**
   * Enable vertical scroll + max height (use with sticky TableHeader for dense lists).
   * @default false
   */
  stickyScroll?: boolean;

  /**
   * Max height class when stickyScroll is true
   * @default 'max-h-[min(70vh,52rem)]'
   */
  scrollMaxHeightClassName?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      striped = false,
      hover = false,
      size: _size = "default",
      stickyScroll = false,
      scrollMaxHeightClassName = "max-h-[min(70vh,52rem)]",
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "relative w-full overflow-x-auto",
          stickyScroll && "overflow-y-auto",
          stickyScroll && scrollMaxHeightClassName
        )}
      >
        <table
          ref={ref}
          className={cn(
            "w-full caption-bottom text-sm",
            striped && "[&_tbody_tr:nth-child(odd)]:bg-muted/50",
            hover && "[&_tbody_tr:hover]:bg-muted/50",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = "Table";

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** Pin header while scrolling the table scroll container (pairs with overflow-auto wrapper). */
  sticky?: boolean;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        "[&_tr]:border-b",
        sticky &&
          "[&_th]:sticky [&_th]:top-0 [&_th]:z-[200] [&_th]:bg-card/95 [&_th]:backdrop-blur-sm [&_th]:shadow-[0_1px_0_0_var(--border)]",
        className
      )}
      {...props}
    />
  )
);
TableHeader.displayName = "TableHeader";

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

export type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  )
);
TableFooter.displayName = "TableFooter";

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
        "border-b transition-colors hover:bg-muted/30",
        clickable && "cursor-pointer hover:bg-muted/50",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("px-4 py-3 align-middle text-sm [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  )
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
