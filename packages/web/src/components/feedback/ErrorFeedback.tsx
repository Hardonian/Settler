/**
 * ErrorFeedback
 * 
 * Error display component that encourages retry and provides helpful guidance.
 * Used for error states in state machines.
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatedButton } from '@/components/motion/AnimatedButton';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/motion/variants';

export interface ErrorFeedbackProps {
  /**
   * Error message or Error object
   */
  error: Error | string | null;
  
  /**
   * Title for the error
   * @default "Something went wrong"
   */
  title?: string;
  
  /**
   * Whether to show retry button
   * @default true
   */
  showRetry?: boolean;
  
  /**
   * Retry button label
   * @default "Try Again"
   */
  retryLabel?: string;
  
  /**
   * Callback when retry is clicked
   */
  onRetry?: () => void;
  
  /**
   * Whether to show dismiss button
   * @default false
   */
  showDismiss?: boolean;
  
  /**
   * Callback when dismiss is clicked
   */
  onDismiss?: () => void;
  
  /**
   * Helpful guidance text
   */
  guidance?: string;
  
  /**
   * Custom className
   */
  className?: string;
}

export function ErrorFeedback({
  error,
  title = 'Something went wrong',
  showRetry = true,
  retryLabel = 'Try Again',
  onRetry,
  showDismiss = false,
  onDismiss,
  guidance,
  className,
}: ErrorFeedbackProps) {
  if (!error) return null;

  const errorMessage =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn('w-full', className)}
    >
      <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-900 dark:text-red-300">{title}</AlertTitle>
        <AlertDescription className="text-red-800 dark:text-red-400">
          {errorMessage}
          {guidance && (
            <span className="block mt-2 text-sm opacity-90">{guidance}</span>
          )}
        </AlertDescription>
      </Alert>

      {(showRetry || showDismiss) && (
        <div className="mt-4 flex gap-2">
          {showRetry && onRetry && (
            <AnimatedButton onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {retryLabel}
            </AnimatedButton>
          )}
          {showDismiss && onDismiss && (
            <AnimatedButton onClick={onDismiss} variant="ghost" size="sm">
              <XCircle className="w-4 h-4 mr-2" />
              Dismiss
            </AnimatedButton>
          )}
        </div>
      )}
    </motion.div>
  );
}
