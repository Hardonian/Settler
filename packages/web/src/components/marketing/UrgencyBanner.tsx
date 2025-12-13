/**
 * Urgency Banner Component
 * 
 * Creates urgency with limited-time offers, social proof, and scarcity.
 */

'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UrgencyBannerProps {
  variant?: 'default' | 'minimal' | 'prominent';
  className?: string;
}

export function UrgencyBanner({ variant = 'default', className }: UrgencyBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4',
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm">
          <Clock className="w-4 h-4" />
          <span>
            <strong>Limited Time:</strong> Annual plans save 17% —{' '}
            {timeLeft.hours}h {timeLeft.minutes}m remaining
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'prominent') {
    return (
      <div
        className={cn(
          'relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-4 px-4',
          'shadow-lg',
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-lg">Flash Sale</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>127 people viewing</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50 font-bold"
            >
              <Link href="/pricing">Claim Offer</Link>
            </Button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm">
        <Clock className="w-4 h-4" />
        <span>
          <strong>Special Offer:</strong> Start your free trial today — No credit card required
        </span>
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="bg-white text-blue-600 hover:bg-blue-50"
        >
          <Link href="/signup">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
