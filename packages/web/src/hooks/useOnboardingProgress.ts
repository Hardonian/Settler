"use client";

import { useEffect, useState } from "react";

interface OnboardingStep {
  step: string;
  completed: boolean;
  completedAt?: Date;
}

interface OnboardingProgress {
  userId: string;
  steps: OnboardingStep[];
  completionPercentage: number;
  completedAt?: Date;
}

export function useOnboardingProgress() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch("/api/user/onboarding-progress");
        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);
          setNextStep(data.nextStep);
        }
      } catch (error) {
        console.error("Failed to fetch onboarding progress", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchProgress();
  }, []);

  return { progress, nextStep, loading };
}
