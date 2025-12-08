import * as React from 'react';
import { cn } from '@/lib/utils';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Heading level (1-6)
   * @default 1
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  
  /**
   * Visual size variant (can differ from semantic level)
   */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  
  /**
   * Font weight
   * @default 'bold'
   */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  
  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right';
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      className,
      level = 1,
      size,
      weight = 'bold',
      align,
      children,
      ...props
    },
    ref
  ) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements;
    
    // Default size based on level if not specified
    const defaultSizes: Record<number, string> = {
      1: '4xl',
      2: '3xl',
      3: '2xl',
      4: 'xl',
      5: 'lg',
      6: 'base',
    };
    
    const sizeVariant = size || defaultSizes[level];
    
    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
    };
    
    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    };
    
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          'leading-tight tracking-tight',
          sizeClasses[sizeVariant],
          weightClasses[weight],
          align && alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Heading.displayName = 'Heading';

export { Heading };
