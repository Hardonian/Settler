/**
 * Improved Button Component
 * Fixes text wrapping issues and adds better accessibility
 */

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      // Base styles
      'inline-flex items-center justify-center gap-2',
      'font-semibold transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',

      // Fix text wrapping with proper constraints
      'whitespace-nowrap text-ellipsis overflow-hidden',
      'max-w-full', // Prevent button from exceeding container

      // Variants
      variant === 'default' &&
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg',
      variant === 'destructive' &&
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md',
      variant === 'outline' &&
        'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground',
      variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
      variant === 'link' && 'text-primary underline-offset-4 hover:underline',
      variant === 'gradient' &&
        'bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]',

      // Sizes with proper padding
      size === 'default' && 'h-11 px-6 py-2 rounded-lg text-base',
      size === 'sm' && 'h-9 px-4 py-1.5 rounded-md text-sm',
      size === 'lg' && 'h-14 px-8 py-3 rounded-xl text-lg',
      size === 'icon' && 'h-10 w-10 rounded-lg',

      // Full width option
      fullWidth && 'w-full',

      className
    );

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        <span className="truncate">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

// Specific button variants for common use cases
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="default" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="outline" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="destructive" {...props} />;
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="ghost" {...props} />;
}

export function GradientButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="gradient" {...props} />;
}

// Button group for multiple buttons
export function ButtonGroup({
  children,
  orientation = 'horizontal',
  className,
}: {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-2',
        orientation === 'vertical' && 'flex-col',
        orientation === 'horizontal' && 'flex-row flex-wrap',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}
