import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * Loading text
   */
  text?: string;
  
  /**
   * Whether to show spinner
   * @default true
   */
  showSpinner?: boolean;
  
  /**
   * Full screen loading overlay
   * @default false
   */
  fullScreen?: boolean;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  (
    {
      className,
      size = 'default',
      text,
      showSpinner = true,
      fullScreen = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      default: 'h-6 w-6',
      lg: 'h-8 w-8',
    };

    const content = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-2',
          fullScreen && 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
          className
        )}
        {...props}
      >
        {showSpinner && (
          <Loader2
            className={cn('animate-spin text-primary-600', sizeClasses[size])}
            aria-hidden="true"
          />
        )}
        {text && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {text}
          </p>
        )}
        {!text && showSpinner && (
          <span className="sr-only">Loading...</span>
        )}
      </div>
    );

    return content;
  }
);
Loading.displayName = 'Loading';

/**
 * Loading Skeleton Component
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width variant
   */
  width?: 'full' | 'sm' | 'md' | 'lg' | 'xl' | string;
  
  /**
   * Height variant
   */
  height?: 'sm' | 'md' | 'lg' | 'xl' | string;
  
  /**
   * Shape variant
   * @default 'rect'
   */
  shape?: 'rect' | 'circle';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, shape = 'rect', ...props }, ref) => {
    const widthClasses = {
      full: 'w-full',
      sm: 'w-16',
      md: 'w-32',
      lg: 'w-48',
      xl: 'w-64',
    };

    const heightClasses = {
      sm: 'h-4',
      md: 'h-6',
      lg: 'h-8',
      xl: 'h-12',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse rounded-md bg-muted',
          width && (typeof width === 'string' && widthClasses[width as keyof typeof widthClasses] ? widthClasses[width as keyof typeof widthClasses] : `w-[${width}]`),
          height && (typeof height === 'string' && heightClasses[height as keyof typeof heightClasses] ? heightClasses[height as keyof typeof heightClasses] : `h-[${height}]`),
          shape === 'circle' && 'rounded-full',
          className
        )}
        {...props}
        aria-hidden="true"
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

export { Loading, Skeleton };
