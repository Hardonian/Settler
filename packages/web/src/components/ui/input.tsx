import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * Whether the input has an error state
   */
  error?: boolean;
  
  /**
   * Left icon element
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Right icon element
   */
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = 'default', error, leftIcon, rightIcon, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-9 text-sm px-3',
      default: 'h-10 text-sm px-3',
      lg: 'h-11 text-base px-4',
    };

    const inputClasses = cn(
      'flex w-full rounded-md border bg-background',
      'ring-offset-background',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-muted-foreground',
      // Enhanced transitions
      'transition-[border-color,background-color,color,box-shadow] duration-200 ease-out',
      // Focus styles
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'focus-visible:ring-offset-background',
      // Hover state
      'hover:border-accent-foreground/50',
      // Disabled state
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
      // Size
      sizeClasses[size],
      // Error state
      error && 'border-destructive focus-visible:ring-destructive hover:border-destructive',
      !error && 'border-input',
      // Icon spacing
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      // Respect reduced motion
      'motion-reduce:transition-none',
      className
    );

    if (leftIcon || rightIcon) {
      return (
        <div className="relative w-full">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={inputClasses}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={inputClasses}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
