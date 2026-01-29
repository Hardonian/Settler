'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Status Indicator Component
 * 
 * Shows real-time system status with link to status page.
 * Useful for transparency and trust building.
 */
export function StatusIndicator() {
  const [status, setStatus] = useState<'operational' | 'degraded' | 'down' | 'checking'>('checking');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check status from status page API
    const checkStatus = async () => {
      try {
        // Try to fetch status from status.settler.dev API
        // Fallback to operational if API unavailable or CSP blocks it
        let response: Response | null = null;
        try {
          response = await fetch('https://status.settler.dev/api/v2/status.json', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            // Don't throw on network errors, let catch handle it
          });
        } catch (fetchError) {
          // CSP violation or network error - silently fallback
          console.debug('Status check failed (likely CSP or network):', fetchError);
          setStatus('operational');
          setIsVisible(true);
          return;
        }

        if (response?.ok) {
          try {
            const data = await response.json();
            // Map status page status to our status
            const pageStatus = data?.status?.indicator || 'operational';
            setStatus(pageStatus === 'none' ? 'operational' : pageStatus === 'minor' ? 'degraded' : 'down');
          } catch {
            // Invalid JSON response - default to operational
            setStatus('operational');
          }
        } else {
          // Non-200 response - default to operational
          setStatus('operational');
        }
      } catch (error: unknown) {
        // Any other error - default to operational
        console.debug('Status check error:', error);
        setStatus('operational');
      }
      setIsVisible(true);
    };

    checkStatus();
    // Check every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return null;
  }

  const statusConfig = {
    operational: {
      icon: CheckCircle2,
      label: 'All systems operational',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    degraded: {
      icon: AlertCircle,
      label: 'Degraded performance',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    down: {
      icon: AlertCircle,
      label: 'Service disruption',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    checking: {
      icon: Loader2,
      label: 'Checking status...',
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-50 dark:bg-slate-800',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Link
      href="https://status.settler.dev"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
        'border transition-all duration-200',
        'hover:shadow-md',
        config.bgColor,
        config.borderColor,
        config.color,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
      aria-label={`System status: ${config.label}. View status page`}
    >
      <Icon
        className={cn(
          'w-3.5 h-3.5',
          status === 'checking' && 'animate-spin'
        )}
      />
      <span>{config.label}</span>
    </Link>
  );
}
