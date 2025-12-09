"use strict";
/**
 * Drop-Off Step Analysis Service
 * Identifies exact steps where users abandon onboarding or workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDropOffSteps = analyzeDropOffSteps;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
/**
 * Analyze drop-off steps for a specific funnel
 */
async function analyzeDropOffSteps(funnel, days = 30) {
    try {
        if (funnel === "onboarding") {
            return await analyzeOnboardingDropOff(days);
        }
        else if (funnel === "reconciliation") {
            return await analyzeReconciliationDropOff(days);
        }
        else {
            return await analyzeExportDropOff(days);
        }
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to analyze drop-off steps", {
            funnel,
            days,
            error: error instanceof Error ? error.message : String(error),
        });
        return {
            funnel,
            steps: [],
            overallCompletionRate: 0,
            biggestDropOff: null,
            suggestions: [],
        };
    }
}
/**
 * Analyze onboarding drop-off
 */
async function analyzeOnboardingDropOff(days) {
    const onboardingSteps = [
        "welcome",
        "profile",
        "first_job",
        "first_reconciliation",
        "first_export",
        "webhook_setup",
    ];
    const steps = [];
    let totalStarted = 0;
    let totalCompleted = 0;
    // Get total users who started onboarding
    const startedResult = await (0, db_1.query)(`SELECT COUNT(DISTINCT user_id) as count
     FROM onboarding_progress
     WHERE created_at > NOW() - INTERVAL '${days} days'`);
    totalStarted = parseInt(startedResult[0]?.count || "0");
    // Analyze each step
    for (let i = 0; i < onboardingSteps.length; i++) {
        const step = onboardingSteps[i];
        const prevStep = i > 0 ? onboardingSteps[i - 1] : null;
        // Get users who completed this step
        if (!step)
            continue;
        const completedResult = await (0, db_1.query)(`SELECT COUNT(DISTINCT user_id) as count
       FROM onboarding_progress
       WHERE step = $1
         AND completed = true
         AND created_at > NOW() - INTERVAL '${days} days'`, [step]);
        const completedUsers = parseInt(completedResult[0]?.count || "0");
        // Get users who completed previous step (or total started for first step)
        let usersAtStep = totalStarted;
        if (prevStep) {
            const prevResult = await (0, db_1.query)(`SELECT COUNT(DISTINCT user_id) as count
         FROM onboarding_progress
         WHERE step = $1
           AND completed = true
           AND created_at > NOW() - INTERVAL '${days} days'`, [prevStep]);
            usersAtStep = parseInt(prevResult[0]?.count || "0");
        }
        // Calculate average time spent (if we have timestamps)
        const timeResult = await (0, db_1.query)(`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_seconds
       FROM onboarding_progress
       WHERE step = $1
         AND completed = true
         AND created_at > NOW() - INTERVAL '${days} days'`, [step]);
        const avgTimeSpent = timeResult[0]?.avg_seconds ? parseFloat(timeResult[0].avg_seconds) : 0;
        const completionRate = usersAtStep > 0 ? (completedUsers / usersAtStep) * 100 : 0;
        const dropOffRate = usersAtStep > 0 ? ((usersAtStep - completedUsers) / usersAtStep) * 100 : 0;
        if (step) {
            steps.push({
                step,
                completionRate: Math.round(completionRate * 100) / 100,
                dropOffRate: Math.round(dropOffRate * 100) / 100,
                avgTimeSpent: Math.round(avgTimeSpent),
                totalUsers: usersAtStep,
                completedUsers,
                droppedUsers: usersAtStep - completedUsers,
            });
        }
        if (i === onboardingSteps.length - 1) {
            totalCompleted = completedUsers;
        }
    }
    const overallCompletionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;
    // Find biggest drop-off
    const biggestDropOff = steps.length > 0
        ? steps.reduce((max, step) => (step.dropOffRate > max.dropOffRate ? step : max))
        : null;
    // Generate suggestions
    const suggestions = [];
    if (biggestDropOff && biggestDropOff.dropOffRate > 30 && biggestDropOff.step) {
        suggestions.push(`${Math.round(biggestDropOff.dropOffRate)}% of users drop off at "${biggestDropOff.step}". Consider: simplifying this step, adding help text, or providing a demo mode.`);
    }
    const firstJobStep = steps.find((s) => s.step === "first_job");
    if (firstJobStep && firstJobStep.dropOffRate > 25) {
        suggestions.push("High drop-off at 'first_job' step. Consider: adding a demo mode, pre-populating sample data, or providing a guided tutorial.");
    }
    if (overallCompletionRate < 50) {
        suggestions.push(`Overall onboarding completion rate is ${Math.round(overallCompletionRate)}%. Consider: breaking down steps further, adding progress indicators, or sending reminder emails.`);
    }
    return {
        funnel: "onboarding",
        steps,
        overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
        biggestDropOff,
        suggestions,
    };
}
/**
 * Analyze reconciliation drop-off
 */
async function analyzeReconciliationDropOff(days) {
    // Steps: job_created → job_executed → reconciliation_completed → export_created
    const steps = [];
    // Step 1: Jobs created
    const jobsCreated = await (0, db_1.query)(`SELECT COUNT(DISTINCT id) as count
     FROM jobs
     WHERE created_at > NOW() - INTERVAL '${days} days'`);
    const totalJobs = parseInt(jobsCreated[0]?.count || "0");
    steps.push({
        step: "job_created",
        completionRate: 100,
        dropOffRate: 0,
        avgTimeSpent: 0,
        totalUsers: totalJobs,
        completedUsers: totalJobs,
        droppedUsers: 0,
    });
    // Step 2: Jobs executed
    const jobsExecuted = await (0, db_1.query)(`SELECT COUNT(DISTINCT j.id) as count
     FROM jobs j
     JOIN executions e ON j.id = e.job_id
     WHERE j.created_at > NOW() - INTERVAL '${days} days'`);
    const executedCount = parseInt(jobsExecuted[0]?.count || "0");
    const executionRate = totalJobs > 0 ? (executedCount / totalJobs) * 100 : 0;
    steps.push({
        step: "job_executed",
        completionRate: executionRate,
        dropOffRate: 100 - executionRate,
        avgTimeSpent: 0,
        totalUsers: totalJobs,
        completedUsers: executedCount,
        droppedUsers: totalJobs - executedCount,
    });
    // Step 3: Reconciliations completed (executions with status = 'completed')
    const reconciliationsCompleted = await (0, db_1.query)(`SELECT COUNT(DISTINCT e.id) as count
     FROM executions e
     JOIN jobs j ON e.job_id = j.id
     WHERE e.status = 'completed'
       AND j.created_at > NOW() - INTERVAL '${days} days'`);
    const completedCount = parseInt(reconciliationsCompleted[0]?.count || "0");
    const completionRate = executedCount > 0 ? (completedCount / executedCount) * 100 : 0;
    steps.push({
        step: "reconciliation_completed",
        completionRate: completionRate,
        dropOffRate: 100 - completionRate,
        avgTimeSpent: 0,
        totalUsers: executedCount,
        completedUsers: completedCount,
        droppedUsers: executedCount - completedCount,
    });
    // Step 4: Exports created
    const exportsCreated = await (0, db_1.query)(`SELECT COUNT(DISTINCT e.id) as count
     FROM exports e
     JOIN executions ex ON e.execution_id = ex.id
     JOIN jobs j ON ex.job_id = j.id
     WHERE j.created_at > NOW() - INTERVAL '${days} days'`);
    const exportCount = parseInt(exportsCreated[0]?.count || "0");
    const exportRate = completedCount > 0 ? (exportCount / completedCount) * 100 : 0;
    steps.push({
        step: "export_created",
        completionRate: exportRate,
        dropOffRate: 100 - exportRate,
        avgTimeSpent: 0,
        totalUsers: completedCount,
        completedUsers: exportCount,
        droppedUsers: completedCount - exportCount,
    });
    const overallCompletionRate = totalJobs > 0 ? (exportCount / totalJobs) * 100 : 0;
    const biggestDropOff = steps.length > 0
        ? steps.reduce((max, step) => (step.dropOffRate > max.dropOffRate ? step : max))
        : null;
    const suggestions = [];
    if (biggestDropOff && biggestDropOff.dropOffRate > 30 && biggestDropOff.step) {
        suggestions.push(`${Math.round(biggestDropOff.dropOffRate)}% drop-off at "${biggestDropOff.step}". Consider: adding progress indicators, error handling improvements, or automated retries.`);
    }
    const jobExecutedStep = steps.find((s) => s.step === "job_executed");
    if (jobExecutedStep && jobExecutedStep.dropOffRate > 25) {
        suggestions.push("Many jobs are created but never executed. Consider: adding a 'Run Now' button, scheduling reminders, or auto-executing on creation.");
    }
    return {
        funnel: "reconciliation",
        steps,
        overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
        biggestDropOff,
        suggestions,
    };
}
/**
 * Analyze export drop-off
 */
async function analyzeExportDropOff(days) {
    // For exports, we analyze: reconciliation_completed → export_created
    const reconciliationsCompleted = await (0, db_1.query)(`SELECT COUNT(DISTINCT e.id) as count
     FROM executions e
     WHERE e.status = 'completed'
       AND e.created_at > NOW() - INTERVAL '${days} days'`);
    const totalCompleted = parseInt(reconciliationsCompleted[0]?.count || "0");
    const exportsCreated = await (0, db_1.query)(`SELECT COUNT(DISTINCT e.id) as count
     FROM exports e
     JOIN executions ex ON e.execution_id = ex.id
     WHERE ex.status = 'completed'
       AND ex.created_at > NOW() - INTERVAL '${days} days'`);
    const exportCount = parseInt(exportsCreated[0]?.count || "0");
    const exportRate = totalCompleted > 0 ? (exportCount / totalCompleted) * 100 : 0;
    const steps = [
        {
            step: "reconciliation_completed",
            completionRate: 100,
            dropOffRate: 0,
            avgTimeSpent: 0,
            totalUsers: totalCompleted,
            completedUsers: totalCompleted,
            droppedUsers: 0,
        },
        {
            step: "export_created",
            completionRate: exportRate,
            dropOffRate: 100 - exportRate,
            avgTimeSpent: 0,
            totalUsers: totalCompleted,
            completedUsers: exportCount,
            droppedUsers: totalCompleted - exportCount,
        },
    ];
    const exportStep = steps.find((s) => s.step === "export_created");
    const biggestDropOff = exportStep || null;
    const suggestions = [];
    if (exportRate < 50) {
        suggestions.push(`Only ${Math.round(exportRate)}% of completed reconciliations are exported. Consider: adding export prompts after reconciliation, making exports more discoverable, or auto-generating exports.`);
    }
    return {
        funnel: "export",
        steps,
        overallCompletionRate: Math.round(exportRate * 100) / 100,
        biggestDropOff,
        suggestions,
    };
}
//# sourceMappingURL=dropoff-analyzer.js.map