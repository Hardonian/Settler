/**
 * Loading Overlay Component
 * 
 * Full-screen loading overlay with spinner.
 */

'use client';

import { LoadingSpinner } from './microinteractions';

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ message = 'Loading...', fullScreen = false }: LoadingOverlayProps) {
  return (
    <div
      className={`${
        fullScreen ? 'fixed inset-0' : 'absolute inset-0'
      } bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}
