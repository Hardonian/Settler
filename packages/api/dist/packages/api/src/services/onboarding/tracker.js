"use strict";
/**
 * Onboarding Progress Tracker
 * Tracks user onboarding progress and completion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackOnboardingStep = trackOnboardingStep;
exports.getOnboardingProgress = getOnboardingProgress;
exports.isOnboardingComplete = isOnboardingComplete;
exports.getNextOnboardingStep = getNextOnboardingStep;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const ONBOARDING_STEPS = [
    "welcome",
    "profile",
    "first_job",
    "first_reconciliation",
    "first_export",
    "webhook_setup",
];
/**
 * Track onboarding step completion
 */
async function trackOnboardingStep(userId, step, completed = true) {
    try {
        await (0, db_1.query)(`INSERT INTO onboarding_progress (user_id, step, completed, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, step) DO UPDATE
       SET completed = $3, updated_at = NOW()`, [userId, step, completed]);
        (0, logger_1.logInfo)("Onboarding step tracked", {
            userId,
            step,
            completed,
        });
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to track onboarding step", {
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
async function getOnboardingProgress(userId) {
    try {
        const results = await (0, db_1.query)(`SELECT step, completed, updated_at
       FROM onboarding_progress
       WHERE user_id = $1
       ORDER BY updated_at ASC`, [userId]);
        if (results.length === 0) {
            return null;
        }
        const steps = ONBOARDING_STEPS.map((step) => {
            const result = results.find((r) => r.step === step);
            const stepResult = {
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
        const result = {
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
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to get onboarding progress", {
            userId,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}
/**
 * Check if onboarding is complete
 */
async function isOnboardingComplete(userId) {
    const progress = await getOnboardingProgress(userId);
    return progress?.completionPercentage === 100;
}
/**
 * Get next onboarding step
 */
async function getNextOnboardingStep(userId) {
    const progress = await getOnboardingProgress(userId);
    if (!progress) {
        return ONBOARDING_STEPS[0];
    }
    const incompleteStep = progress.steps.find((s) => !s.completed);
    return incompleteStep ? incompleteStep.step : null;
}
//# sourceMappingURL=tracker.js.map