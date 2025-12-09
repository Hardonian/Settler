/**
 * Onboarding Progress Tracker
 * Tracks user onboarding progress and completion
 */
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
declare const ONBOARDING_STEPS: readonly ["welcome", "profile", "first_job", "first_reconciliation", "first_export", "webhook_setup"];
export type OnboardingStepType = (typeof ONBOARDING_STEPS)[number];
/**
 * Track onboarding step completion
 */
export declare function trackOnboardingStep(userId: string, step: OnboardingStepType, completed?: boolean): Promise<void>;
/**
 * Get onboarding progress for user
 */
export declare function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null>;
/**
 * Check if onboarding is complete
 */
export declare function isOnboardingComplete(userId: string): Promise<boolean>;
/**
 * Get next onboarding step
 */
export declare function getNextOnboardingStep(userId: string): Promise<OnboardingStepType | null>;
export {};
//# sourceMappingURL=tracker.d.ts.map