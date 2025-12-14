/**
 * Onboarding Wizard Component
 * 
 * Guided onboarding flow with progress tracking.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  optional: boolean;
  status: 'completed' | 'current' | 'pending' | 'skipped';
}

interface OnboardingWizardProps {
  progress?: number;
  currentStep?: string;
  steps?: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export function OnboardingWizard({
  progress = 0,
  steps = [],
  onSkip,
  className,
}: OnboardingWizardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Hide if completed
  useEffect(() => {
    if (progress === 100) {
      setIsDismissed(true);
    }
  }, [progress]);

  if (isDismissed || steps.length === 0) {
    return null;
  }

  const currentStepIndex = steps.findIndex(s => s.status === 'current');
  const currentStepData = steps[currentStepIndex] || steps[0];

  return (
    <Card className={cn('border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to get the most out of Settler
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8"
            aria-label="Dismiss onboarding"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">Progress</span>
            <span className="font-medium text-slate-900 dark:text-white">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Step */}
          {currentStepData && (
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {currentStepData.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {currentStepData.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {currentStepData.description}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={currentStepData.actionUrl}>
                        {currentStepData.actionLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    {currentStepData.optional && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSkip}
                      >
                        Skip
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Remaining Steps */}
          <div className="space-y-2">
            {steps
              .filter(s => s.status !== 'current')
              .slice(0, 3)
              .map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    step.status === 'completed'
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                  )}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : step.status === 'skipped' ? (
                    <Circle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      step.status === 'completed'
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-slate-600 dark:text-slate-400'
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
