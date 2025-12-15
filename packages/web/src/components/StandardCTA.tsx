/**
 * StandardCTA Component
 * 
 * Type-safe, consistent CTA component with proper accessibility
 * and performance optimizations.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StandardCTAProps {
  /**
   * Primary action text
   */
  primaryText: string;
  
  /**
   * Primary action URL
   */
  primaryHref: string;
  
  /**
   * Secondary action text (optional)
   */
  secondaryText?: string;
  
  /**
   * Secondary action URL (optional)
   */
  secondaryHref?: string;
  
  /**
   * CTA variant
   * @default 'default'
   */
  variant?: 'default' | 'hero' | 'minimal';
  
  /**
   * Size variant
   * @default 'lg'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Track CTA click (for analytics)
   */
  onPrimaryClick?: () => void;
  
  /**
   * Track secondary click (for analytics)
   */
  onSecondaryClick?: () => void;
  
  /**
   * ARIA label for primary button
   */
  primaryAriaLabel?: string;
  
  /**
   * ARIA label for secondary button
   */
  secondaryAriaLabel?: string;
}

/**
 * StandardCTA - Consistent, accessible CTA component
 * 
 * Features:
 * - Type-safe props
 * - Proper accessibility (ARIA labels, focus states)
 * - Consistent styling
 * - Analytics tracking support
 * - Performance optimized (no unnecessary re-renders)
 */
export function StandardCTA({
  primaryText,
  primaryHref,
  secondaryText,
  secondaryHref,
  variant = 'default',
  size = 'lg',
  className,
  onPrimaryClick,
  onSecondaryClick,
  primaryAriaLabel,
  secondaryAriaLabel,
}: StandardCTAProps) {
  const isHero = variant === 'hero';
  const isMinimal = variant === 'minimal';
  
  const primaryButtonClasses = cn(
    isHero && 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-blue-500/30',
    !isHero && !isMinimal && 'bg-primary-600 hover:bg-primary-700',
    'transition-all transform hover:scale-105 active:scale-95',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  );
  
  const secondaryButtonClasses = cn(
    isHero && 'border-2 border-white text-white hover:bg-white/10',
    !isHero && !isMinimal && 'border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900',
    'transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  );
  
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-4 justify-center items-center',
        className
      )}
      role="group"
      aria-label="Call to action buttons"
    >
      <Button
        size={size}
        asChild
        className={primaryButtonClasses}
        onClick={onPrimaryClick}
      >
        <Link
          href={primaryHref}
          aria-label={primaryAriaLabel || primaryText}
          className="flex items-center gap-2"
        >
          <span>{primaryText}</span>
          {isHero && <ArrowRight className="w-5 h-5" aria-hidden="true" />}
        </Link>
      </Button>
      
      {secondaryText && secondaryHref && (
        <Button
          size={size}
          variant="outline"
          asChild
          className={secondaryButtonClasses}
          onClick={onSecondaryClick}
        >
          <Link
            href={secondaryHref}
            aria-label={secondaryAriaLabel || secondaryText}
          >
            {secondaryText}
          </Link>
        </Button>
      )}
    </div>
  );
}
