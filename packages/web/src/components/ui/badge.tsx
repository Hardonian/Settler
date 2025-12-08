import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'border-transparent bg-primary-600 text-white hover:bg-primary-700',
      secondary: 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
      destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border-border text-foreground bg-transparent hover:bg-accent',
      success: 'border-transparent bg-green-600 text-white hover:bg-green-700',
      warning: 'border-transparent bg-yellow-600 text-white hover:bg-yellow-700',
    };

    const sizes = {
      sm: 'px-1.5 py-0.5 text-xs',
      default: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-semibold',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
