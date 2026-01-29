/**
 * Client-side Onboarding Wizard Component
 * 
 * Fetches onboarding progress client-side for better UX.
 */

'use client';

import { useEffect, useState } from 'react';
import { OnboardingWizard } from './OnboardingWizard';

export function OnboardingWizardClient() {
  const [progress, setProgress] = useState<{
    progress: number;
    currentStep: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      actionLabel: string;
      actionUrl: string;
      optional: boolean;
      status: 'completed' | 'current' | 'pending' | 'skipped';
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/onboarding/progress');
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      } catch (error: unknown) {
        console.error('[Onboarding] Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, []);

  if (loading || !progress || progress.progress === 100) {
    return null;
  }

  return (
    <OnboardingWizard
      progress={progress.progress}
      currentStep={progress.currentStep}
      steps={progress.steps}
    />
  );
}
