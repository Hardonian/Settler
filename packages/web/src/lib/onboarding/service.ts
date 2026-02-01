/**
 * Onboarding Service
 * 
 * Manages user onboarding progress and provides next steps.
 */

import { prisma } from '@/shared/db/prismaClient';
import { createClient } from '@/lib/supabase/server';

export type OnboardingStep = 
  | 'welcome'
  | 'create_api_key'
  | 'try_playground'
  | 'first_reconciliation'
  | 'invite_team'
  | 'complete';

export interface OnboardingProgress {
  id: string;
  userId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skippedSteps: OnboardingStep[];
  progress: number; // 0-100
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingStepInfo {
  id: OnboardingStep;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  optional: boolean;
}

const ONBOARDING_STEPS: OnboardingStepInfo[] = [
  {
    id: 'welcome',
    title: 'Welcome to Settler',
    description: 'Learn about Settler and what you can do',
    actionLabel: 'Get Started',
    actionUrl: '/console',
    optional: false,
  },
  {
    id: 'create_api_key',
    title: 'Create Your First API Key',
    description: 'Generate an API key to start using the Settler API',
    actionLabel: 'Create API Key',
    actionUrl: '/console/api-keys',
    optional: false,
  },
  {
    id: 'try_playground',
    title: 'Try the Playground',
    description: 'Test the API in our interactive playground',
    actionLabel: 'Open Playground',
    actionUrl: '/console/playground',
    optional: false,
  },
  {
    id: 'first_reconciliation',
    title: 'Create Your First Reconciliation',
    description: 'Set up your first reconciliation job',
    actionLabel: 'Create Job',
    actionUrl: '/console/playground/reconcile',
    optional: false,
  },
  {
    id: 'invite_team',
    title: 'Invite Your Team',
    description: 'Collaborate with your team members',
    actionLabel: 'Invite Team',
    actionUrl: '/console',
    optional: true,
  },
  {
    id: 'complete',
    title: 'Onboarding Complete!',
    description: 'You\'re all set to start using Settler',
    actionLabel: 'Go to Dashboard',
    actionUrl: '/console',
    optional: false,
  },
];

/**
 * Get or create onboarding progress for a user
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  try {
    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      // Create initial progress
      progress = await prisma.onboardingProgress.create({
        data: {
          userId,
          currentStep: 'welcome',
          completedSteps: [],
          skippedSteps: [],
          progress: 0,
        },
      });
    }

    return progress as OnboardingProgress;
  } catch (_error) {
    console.error('[Onboarding] Error getting progress:', error);
    return null;
  }
}

/**
 * Get current onboarding step info
 */
export function getCurrentStepInfo(step: OnboardingStep): OnboardingStepInfo | null {
  return ONBOARDING_STEPS.find(s => s.id === step) || null;
}

/**
 * Get all onboarding steps with completion status
 */
export function getAllStepsWithStatus(
  currentStep: OnboardingStep,
  completedSteps: OnboardingStep[],
  skippedSteps: OnboardingStep[]
): Array<OnboardingStepInfo & { status: 'completed' | 'current' | 'pending' | 'skipped' }> {
  return ONBOARDING_STEPS.map(step => {
    if (completedSteps.includes(step.id)) {
      return { ...step, status: 'completed' as const };
    }
    if (skippedSteps.includes(step.id)) {
      return { ...step, status: 'skipped' as const };
    }
    if (step.id === currentStep) {
      return { ...step, status: 'current' as const };
    }
    return { ...step, status: 'pending' as const };
  });
}

/**
 * Mark a step as completed
 */
export async function completeStep(
  userId: string,
  step: OnboardingStep
): Promise<OnboardingProgress | null> {
  try {
    const progress = await getOnboardingProgress(userId);
    if (!progress) return null;

    const completedSteps = [...new Set([...progress.completedSteps, step])];
    const skippedSteps = progress.skippedSteps.filter(s => s !== step);
    
    // Find next step
    const currentStepIndex = ONBOARDING_STEPS.findIndex(s => s.id === progress.currentStep);
    const nextStep = ONBOARDING_STEPS[currentStepIndex + 1];
    const newCurrentStep = nextStep ? nextStep.id : 'complete';
    
    // Calculate progress
    const totalSteps = ONBOARDING_STEPS.length - 1; // Exclude 'complete' step
    const newProgress = Math.min(100, Math.round((completedSteps.length / totalSteps) * 100));
    
    const completedAt = newProgress === 100 ? new Date() : null;

    const updated = await prisma.onboardingProgress.update({
      where: { userId },
      data: {
        currentStep: newCurrentStep,
        completedSteps,
        skippedSteps,
        progress: newProgress,
        completedAt,
      },
    });

    return updated as OnboardingProgress;
  } catch (_error) {
    console.error('[Onboarding] Error completing step:', error);
    return null;
  }
}

/**
 * Skip a step
 */
export async function skipStep(
  userId: string,
  step: OnboardingStep
): Promise<OnboardingProgress | null> {
  try {
    const progress = await getOnboardingProgress(userId);
    if (!progress) return null;

    const skippedSteps = [...new Set([...progress.skippedSteps, step])];
    const completedSteps = progress.completedSteps.filter(s => s !== step);
    
    // Find next step
    const currentStepIndex = ONBOARDING_STEPS.findIndex(s => s.id === progress.currentStep);
    const nextStep = ONBOARDING_STEPS[currentStepIndex + 1];
    const newCurrentStep = nextStep ? nextStep.id : 'complete';
    
    // Calculate progress
    const totalSteps = ONBOARDING_STEPS.length - 1;
    const newProgress = Math.min(100, Math.round((completedSteps.length / totalSteps) * 100));

    const updated = await prisma.onboardingProgress.update({
      where: { userId },
      data: {
        currentStep: newCurrentStep,
        completedSteps,
        skippedSteps,
        progress: newProgress,
      },
    });

    return updated as OnboardingProgress;
  } catch (_error) {
    console.error('[Onboarding] Error skipping step:', error);
    return null;
  }
}

/**
 * Check if user has completed onboarding
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  try {
    const progress = await getOnboardingProgress(userId);
    return progress?.progress === 100 || progress?.currentStep === 'complete' || false;
  } catch (_error) {
    console.error('[Onboarding] Error checking completion:', error);
    return false;
  }
}

/**
 * Get onboarding progress for current user
 */
export async function getCurrentUserOnboardingProgress(): Promise<OnboardingProgress | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    return await getOnboardingProgress(user.id);
  } catch (_error) {
    console.error('[Onboarding] Error getting current user progress:', error);
    return null;
  }
}
