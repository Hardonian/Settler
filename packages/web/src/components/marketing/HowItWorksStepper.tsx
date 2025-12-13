'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeImage } from './SafeImage';

interface Step {
  number: number;
  title: string;
  description: string;
  details: string[];
}

interface HowItWorksStepperProps {
  steps: Step[];
  workflowImageSrc: string;
  workflowImageAlt: string;
  className?: string;
}

/**
 * Interactive stepper component that highlights steps and shows workflow visualization
 * Clicking a step updates the active state and scrolls to show relevant details
 */
export function HowItWorksStepper({
  steps,
  workflowImageSrc,
  workflowImageAlt,
  className,
}: HowItWorksStepperProps) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start', className)}>
      {/* Steps List */}
      <div className="space-y-4" role="list" aria-label="Workflow steps">
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          return (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={cn(
                'w-full text-left p-6 rounded-xl border-2 transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
              )}
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${step.number}: ${step.title}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  )}
                  aria-hidden="true"
                >
                  {step.number}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'text-xl font-bold mb-2',
                      isActive
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      'text-base mb-3',
                      isActive
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {step.description}
                  </p>
                  {isActive && step.details.length > 0 && (
                    <ul className="space-y-2 mt-4" role="list">
                      {step.details.map((detail, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Workflow Image */}
      <div className="sticky top-24">
        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-lg">
          <SafeImage
            src={workflowImageSrc}
            alt={workflowImageAlt}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          {/* Step Indicator Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
            <div className="font-semibold mb-1">Step {steps[activeStep].number}</div>
            <div className="text-white/80">{steps[activeStep].title}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
