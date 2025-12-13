"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  completed: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep?: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  const activeIndex = currentStep ?? steps.findIndex((s) => !s.completed);

  return (
    <div 
      className={cn("flex items-center gap-2", className)} 
      role="progressbar" 
      aria-valuenow={activeIndex + 1} 
      aria-valuemin={1} 
      aria-valuemax={steps.length}
      aria-label={`Progress: Step ${activeIndex + 1} of ${steps.length}`}
    >
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-all",
              step.completed || index < activeIndex
                ? "bg-green-500 text-white"
                : index === activeIndex
                ? "bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-800"
                : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            )}
            aria-label={step.completed ? `Completed: ${step.label}` : `Step ${index + 1}: ${step.label}`}
          >
            {step.completed || index < activeIndex ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <span className="text-xs font-bold">{index + 1}</span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 transition-colors",
                step.completed || index < activeIndex
                  ? "bg-green-500"
                  : "bg-slate-200 dark:bg-slate-700"
              )}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Quick start progress component
export function QuickStartProgress() {
  const steps: Step[] = [
    { label: "Sign up", completed: false },
    { label: "Get API key", completed: false },
    { label: "First reconciliation", completed: false },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
      <div className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
        Quick Start Progress
      </div>
      <ProgressIndicator steps={steps} />
      <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
        Complete all steps to unlock advanced features
      </div>
    </div>
  );
}
