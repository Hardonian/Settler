/**
 * EmptyState Component
 * 
 * Reusable empty state display component with consistent styling and accessibility.
 */

'use client';

import { Inbox, LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /**
   * Icon to display
   */
  icon?: LucideIcon;
  /**
   * Title for the empty state
   */
  title?: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Additional className
   */
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No data available',
  description,
  action,
  size = 'default',
  className,
}: EmptyStateProps) {
  // Ensure title is a proper heading level
  const HeadingTag = size === 'lg' ? 'h2' : size === 'sm' ? 'h4' : 'h3';
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-10 h-10',
      title: 'text-base',
      description: 'text-sm',
    },
    default: {
      container: 'py-12',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-lg',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4',
        currentSize.container,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn(
          'text-muted-foreground mb-4',
          currentSize.icon,
          'motion-safe:animate-fade-in'
        )}
        aria-hidden="true"
      />
      <HeadingTag
        className={cn(
          'font-semibold text-foreground mb-2 text-center',
          currentSize.title
        )}
      >
        {title}
      </HeadingTag>
      {description && (
        <p
          className={cn(
            'text-muted-foreground text-center mb-6 max-w-md mx-auto',
            currentSize.description
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant="default"
          size={size === 'sm' ? 'sm' : 'default'}
          aria-label={action.label}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
