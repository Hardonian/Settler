'use client';

import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedPageWrapperProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * Reusable animated page wrapper
 * Provides consistent animations, accessibility, and performance optimizations
 */
export function AnimatedPageWrapper({
  children,
  className = '',
  'aria-label': ariaLabel,
}: AnimatedPageWrapperProps) {
  useEffect(() => {
    // Component mounted
  }, []);

  return (
    <>
      {/* Skip to main content for accessibility */}
      <a 
        href="#main-content" 
        className="skip-to-main"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      <div 
        id="main-content"
        className={cn(
          'min-h-screen',
          'bg-gradient-to-br from-background via-primary-50/50 to-electric-indigo/10',
          'dark:from-background dark:via-background dark:to-background',
          className
        )}
        role="main"
        aria-label={ariaLabel || 'Page content'}
      >
        {children}
      </div>
    </>
  );
}
