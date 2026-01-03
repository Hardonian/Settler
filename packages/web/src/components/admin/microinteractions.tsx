/**
 * Microinteractions Components
 * 
 * Hover states, transitions, loading animations, and interactive feedback.
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Animated loading spinner
 */
export function LoadingSpinner({ 
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Loading',
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-slate-400',
        sizeClasses[size],
        className
      )} 
      aria-label={ariaLabel}
      role="status"
    />
  );
}

/**
 * Success checkmark animation
 */
export function SuccessCheckmark({ 
  show,
  className 
}: { 
  show: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'transition-all duration-300',
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-0',
        className
      )}
    >
      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
    </div>
  );
}

/**
 * Pulse animation for important elements
 */
export function PulseIndicator({ 
  active,
  color = 'blue'
}: { 
  active: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  if (!active) return null;

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <span className="relative flex h-2 w-2">
      <span className={cn(
        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
        colorClasses[color]
      )} />
      <span className={cn(
        'relative inline-flex rounded-full h-2 w-2',
        colorClasses[color]
      )} />
    </span>
  );
}

/**
 * Hover card with elevation
 */
export function HoverCard({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        'focus-within:shadow-lg focus-within:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Shimmer loading effect
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r',
        'from-slate-200 via-slate-100 to-slate-200',
        'dark:from-slate-800 dark:via-slate-700 dark:to-slate-800',
        'bg-[length:200%_100%]',
        className
      )}
    />
  );
}

/**
 * Number counter animation
 */
export function AnimatedNumber({ 
  value,
  duration = 1000,
  className 
}: { 
  value: number;
  duration?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(value * progress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
    </span>
  );
}

/**
 * Ripple effect on click
 */
export function RippleButton({ 
  children,
  onClick,
  className 
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn('relative overflow-hidden', className)}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </button>
  );
}
