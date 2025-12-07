/**
 * Onboarding Progress Tracker
 * Tracks user onboarding progress and completion
 */

import { query } from "../../db";
import { logInfo } from "../../utils/logger";

export interface OnboardingStep {
  step: string;
  completed: boolean;
  completedAt?: Date;
}

export interface OnboardingProgress {
  userId: string;
  steps: OnboardingStep[];
  completionPercentage: number;
  completedAt?: Date;
}

const ONBOARDING_STEPS = [
  "welcome",
  "profile",
  "first_job",
  "first_reconciliation",
  "first_export",
  "webhook_setup",
] as const;

export type OnboardingStepType = (typeof ONBOARDING_STEPS)[number];

/**
 * Track onboarding step completion
 */
export async function trackOnboardingStep(
  userId: string,
  step: OnboardingStepType,
  completed: boolean = true
): Promise<void> {
  try {
    await query(
      `INSERT INTO onboarding_progress (user_id, step, completed, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, step) DO UPDATE
       SET completed = $3, updated_at = NOW()`,
      [userId, step, completed]
    );

    logInfo("Onboarding step tracked", {
      userId,
      step,
      completed,
    });
  } catch (error) {
    logInfo("Failed to track onboarding step", {
      userId,
      step,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - onboarding tracking is non-critical
  }
}

/**
 * Get onboarding progress for user
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  try {
    const results = await query<{
      step: string;
      completed: boolean;
      updated_at: Date;
    }>(
      `SELECT step, completed, updated_at
       FROM onboarding_progress
       WHERE user_id = $1
       ORDER BY updated_at ASC`,
      [userId]
    );

    if (results.length === 0) {
      return null;
    }

    const steps: OnboardingStep[] = ONBOARDING_STEPS.map((step) => {
      const result = results.find((r) => r.step === step);
      const stepResult: OnboardingStep = {
        step,
        completed: result?.completed || false,
      };
      if (result?.completed && result.updated_at) {
        stepResult.completedAt = result.updated_at;
      }
      return stepResult;
    });

    const completedSteps = steps.filter((s) => s.completed).length;
    const completionPercentage = Math.round((completedSteps / ONBOARDING_STEPS.length) * 100);

    const result: OnboardingProgress = {
      userId,
      steps,
      completionPercentage,
    };

    if (completionPercentage === 100 && results.length > 0) {
      const lastResult = results[results.length - 1];
      if (lastResult && lastResult.updated_at) {
        result.completedAt = lastResult.updated_at;
      }
    }

    return result;
  } catch (error) {
    logInfo("Failed to get onboarding progress", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const progress = await getOnboardingProgress(userId);
  return progress?.completionPercentage === 100;
}

/**
 * Get next onboarding step
 */
export async function getNextOnboardingStep(userId: string): Promise<OnboardingStepType | null> {
  const progress = await getOnboardingProgress(userId);
  if (!progress) {
    return ONBOARDING_STEPS[0];
  }

  const incompleteStep = progress.steps.find((s) => !s.completed);
  return incompleteStep ? (incompleteStep.step as OnboardingStepType) : null;
}
