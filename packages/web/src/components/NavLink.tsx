import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

export interface NavLinkProps extends ComponentProps<typeof Link> {
  /**
   * Whether link is active
   */
  active?: boolean;
}

/**
 * Navigation link component with consistent styling
 */
export function NavLink({ className, active, children, ...props }: NavLinkProps) {
  return (
    <Link
      className={cn(
        'text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'rounded px-2 py-1',
        active && 'text-primary-600 dark:text-primary-400 font-medium',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
