"use strict";
/**
 * Email Scheduler
 *
 * Scheduled jobs for lifecycle email automation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTrialLifecycleEmails = processTrialLifecycleEmails;
exports.processMonthlySummaryEmails = processMonthlySummaryEmails;
exports.processLowActivityEmails = processLowActivityEmails;
exports.setupEmailScheduler = setupEmailScheduler;
const logger_1 = require("../utils/logger");
/**
 * Calculate days remaining in trial
 */
// @ts-expect-error - Reserved for future use
function _calculateDaysRemaining(_trialEndDate) {
    return 0;
}
/**
 * Process trial lifecycle emails
 * Should be called daily via cron job
 */
async function processTrialLifecycleEmails() {
    try {
        (0, logger_1.logInfo)("Processing trial lifecycle emails");
        // In production, fetch users from database
        // For now, this is a placeholder structure
        // const users = await getTrialUsers();
        // Example structure:
        // const users = [
        //   {
        //     email: 'user@example.com',
        //     firstName: 'John',
        //     trialStartDate: '2025-01-01',
        //     trialEndDate: '2025-01-31',
        //     // ... other user data
        //   },
        // ];
        // for (const user of users) {
        //   const trialData: TrialData = {
        //     trialStartDate: user.trialStartDate,
        //     trialEndDate: user.trialEndDate,
        //     daysRemaining: calculateDaysRemaining(user.trialEndDate),
        //   };
        //
        //   const lifecycleUser: LifecycleUser = {
        //     email: user.email,
        //     firstName: user.firstName,
        //     industry: user.industry,
        //     planType: 'trial',
        //   };
        //
        //   // Send appropriate email based on days remaining
        //   if (shouldSendTrialEmail(trialData.trialEndDate, 7)) {
        //     await sendTrialGatedFeaturesEmail(lifecycleUser, trialData);
        //   } else if (shouldSendTrialEmail(trialData.trialEndDate, 14)) {
        //     await sendTrialCaseStudyEmail(lifecycleUser, trialData, {
        //       companyName: 'Example Company',
        //       caseStudyUrl: 'https://settler.dev/case-studies/example',
        //     });
        //   } else if (shouldSendTrialEmail(trialData.trialEndDate, 21)) {
        //     await sendTrialComparisonEmail(lifecycleUser, trialData);
        //   } else if (shouldSendTrialEmail(trialData.trialEndDate, 3)) {
        //     await sendTrialUrgencyEmail(lifecycleUser, trialData, 27);
        //   } else if (shouldSendTrialEmail(trialData.trialEndDate, 2)) {
        //     await sendTrialUrgencyEmail(lifecycleUser, trialData, 28);
        //   } else if (shouldSendTrialEmail(trialData.trialEndDate, 1)) {
        //     await sendTrialUrgencyEmail(lifecycleUser, trialData, 29);
        //   } else if (shouldSendTrialEmail(trialData.trialEndDate, 0)) {
        //     await sendTrialEndedEmail(lifecycleUser);
        //   }
        // }
        (0, logger_1.logInfo)("Trial lifecycle emails processed");
    }
    catch (error) {
        (0, logger_1.logError)("Failed to process trial lifecycle emails", error);
    }
}
/**
 * Process monthly summary emails
 * Should be called on the 1st of each month
 */
async function processMonthlySummaryEmails() {
    try {
        (0, logger_1.logInfo)("Processing monthly summary emails");
        // In production, fetch paid users from database
        // For each user, calculate metrics and send email
        // Example:
        // const paidUsers = await getPaidUsers();
        // for (const user of paidUsers) {
        //   const metrics = await calculateUserMetrics(user.id, lastMonth);
        //   await sendMonthlySummaryEmail(user, metrics);
        // }
        (0, logger_1.logInfo)("Monthly summary emails processed");
    }
    catch (error) {
        (0, logger_1.logError)("Failed to process monthly summary emails", error);
    }
}
/**
 * Process low activity nudges
 * Should be called daily
 */
async function processLowActivityEmails() {
    try {
        (0, logger_1.logInfo)("Processing low activity emails");
        // In production, find users inactive for 7+ days
        // const inactiveUsers = await getInactiveUsers(7);
        // for (const user of inactiveUsers) {
        //   await sendLowActivityEmail(user);
        // }
        (0, logger_1.logInfo)("Low activity emails processed");
    }
    catch (error) {
        (0, logger_1.logError)("Failed to process low activity emails", error);
    }
}
/**
 * Setup cron jobs (example using node-cron syntax)
 *
 * In production, use a proper job scheduler like:
 * - BullMQ with cron jobs
 * - Vercel Cron Jobs
 * - AWS EventBridge
 * - Google Cloud Scheduler
 */
function setupEmailScheduler() {
    // Example cron setup (would need node-cron or similar)
    // cron.schedule('0 9 * * *', processTrialLifecycleEmails); // Daily at 9 AM
    // cron.schedule('0 9 1 * *', processMonthlySummaryEmails); // 1st of month at 9 AM
    // cron.schedule('0 10 * * *', processLowActivityEmails); // Daily at 10 AM
    (0, logger_1.logInfo)("Email scheduler setup complete");
}
//# sourceMappingURL=email-scheduler.js.map