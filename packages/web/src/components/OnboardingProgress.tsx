"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface OnboardingStep {
  step: string;
  completed: boolean;
  completedAt?: Date;
}

interface OnboardingProgressProps {
  progress?: {
    userId: string;
    steps: OnboardingStep[];
    completionPercentage: number;
    completedAt?: Date;
  };
  nextStep?: string | null;
}

const stepLabels: Record<string, { label: string; link: string; description: string }> = {
  welcome: {
    label: "Welcome",
    link: "/dashboard",
    description: "Get started with Settler",
  },
  profile: {
    label: "Complete Profile",
    link: "/dashboard?setup=profile",
    description: "Help us personalize your experience",
  },
  first_job: {
    label: "Create First Job",
    link: "/playground",
    description: "Set up your first reconciliation",
  },
  first_reconciliation: {
    label: "Run First Reconciliation",
    link: "/playground",
    description: "See results in action",
  },
  first_export: {
    label: "Export Results",
    link: "/dashboard/jobs",
    description: "Download your first report",
  },
  webhook_setup: {
    label: "Set Up Webhooks",
    link: "/dashboard/webhooks",
    description: "Enable real-time updates",
  },
};

function getStepLink(step: string): string {
  return stepLabels[step]?.link || "/dashboard";
}

function getStepLabel(step: string): string {
  return stepLabels[step]?.label || step.replace(/_/g, " ");
}

function getStepDescription(step: string): string {
  return stepLabels[step]?.description || "";
}

export function OnboardingProgress({ progress, nextStep }: OnboardingProgressProps) {
  if (!progress) {
    return null;
  }

  // Don't show if completed
  if (progress.completionPercentage === 100) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Onboarding Complete! 🎉
          </CardTitle>
          <CardDescription>
            You've completed all setup steps. You're ready to use all features!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Complete your setup to unlock all features</CardDescription>
          </div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {progress.completionPercentage}% complete
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress.completionPercentage} className="h-2" />

        <div className="space-y-2">
          {progress.steps.map((step) => (
            <div
              key={step.step}
              className={`flex items-center gap-3 p-2 rounded ${
                step.completed
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-slate-50 dark:bg-slate-800"
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.completed
                      ? "text-slate-500 line-through"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {getStepLabel(step.step)}
                </p>
                {!step.completed && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getStepDescription(step.step)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {nextStep && (
          <Button asChild className="w-full" size="sm">
            <Link href={getStepLink(nextStep)}>Continue: {getStepLabel(nextStep)}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
