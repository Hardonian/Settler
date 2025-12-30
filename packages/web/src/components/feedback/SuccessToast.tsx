/**
 * SuccessToast
 * 
 * Non-blocking success notification with subtle celebration animation.
 * Auto-dismisses after a delay.
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp, success } from '@/lib/motion/variants';

export interface SuccessToastProps {
  /**
   * Whether toast is visible
   */
  open: boolean;
  
  /**
   * Success message
   */
  message: string;
  
  /**
   * Callback when toast is dismissed
   */
  onDismiss: () => void;
  
  /**
   * Auto-dismiss delay in milliseconds
   * @default 3000
   */
  autoDismissDelay?: number;
  
  /**
   * Show celebration animation
   * @default true
   */
  celebrate?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
}

export function SuccessToast({
  open,
  message,
  onDismiss,
  autoDismissDelay = 3000,
  celebrate = true,
  className,
}: SuccessToastProps) {
  React.useEffect(() => {
    if (open && autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, autoDismissDelay, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'fixed bottom-4 right-4 z-50',
            'bg-white dark:bg-slate-800',
            'border border-green-200 dark:border-green-800',
            'rounded-lg shadow-lg',
            'p-4 max-w-sm',
            'flex items-start gap-3',
            className
          )}
          role="alert"
          aria-live="polite"
        >
          <motion.div
            variants={celebrate ? success : undefined}
            initial="hidden"
            animate="visible"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {message}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
