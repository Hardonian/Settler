"use client";

import { OnboardingProgress } from "./OnboardingProgress";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";

export function OnboardingProgressClient() {
  const { progress, nextStep, loading } = useOnboardingProgress();

  if (loading) {
    return null; // Or show loading skeleton
  }

  return <OnboardingProgress progress={progress ?? undefined} nextStep={nextStep ?? undefined} />;
}
