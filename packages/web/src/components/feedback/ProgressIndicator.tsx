/**
 * ProgressIndicator
 * 
 * Shows progress through multi-step flows with step indicators and percentage.
 * Animates progress changes smoothly.
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motionDurations, getReducedMotionDuration } from '@/lib/motion/tokens';

export interface ProgressStep {
  id: string;
  label: string;
  completed?: boolean;
  current?: boolean;
}

export interface ProgressIndicatorProps {
  /**
   * Current progress percentage (0-100)
   */
  progress: number;
  
  /**
   * Steps to display (optional)
   */
  steps?: ProgressStep[];
  
  /**
   * Show percentage text
   * @default true
   */
  showPercentage?: boolean;
  
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * Custom className
   */
  className?: string;
}

export function ProgressIndicator({
  progress,
  steps,
  showPercentage = true,
  size = 'default',
  className,
}: ProgressIndicatorProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const sizeClasses = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Progress
        </span>
        {showPercentage && (
          <motion.span
            key={clampedProgress}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: getReducedMotionDuration(motionDurations.fast),
            }}
            className="text-sm text-slate-600 dark:text-slate-400"
          >
            {Math.round(clampedProgress)}%
          </motion.span>
        )}
      </div>
      <div className="relative">
        <Progress value={clampedProgress} className={sizeClasses[size]} />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
          style={{
            width: `${clampedProgress}%`,
            transition: `width ${getReducedMotionDuration(motionDurations.moderate)}s ease-out`,
          }}
        />
      </div>

      {/* Step Indicators */}
      {steps && steps.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: step.current ? 1.1 : 1,
                  }}
                  transition={{
                    duration: getReducedMotionDuration(motionDurations.fast),
                  }}
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : step.current ? (
                    <Circle className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-xs mt-1 text-center',
                    step.current
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : step.completed
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    step.completed
                      ? 'bg-green-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
