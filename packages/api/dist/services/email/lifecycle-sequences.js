"use strict";
/**
 * Complete Lifecycle Email Sequences
 * Day 7, 14, 21, 27, 29, 30 emails for trial users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDay7FirstValueEmail = sendDay7FirstValueEmail;
exports.sendDay14ProgressEmail = sendDay14ProgressEmail;
exports.sendDay21FeatureEmail = sendDay21FeatureEmail;
exports.sendDay27ExpirationWarning = sendDay27ExpirationWarning;
exports.sendDay29FinalReminder = sendDay29FinalReminder;
exports.sendDay30TrialEnded = sendDay30TrialEnded;
exports.processLifecycleEmails = processLifecycleEmails;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const tracker_1 = require("../onboarding/tracker");
const metrics_1 = require("../analytics/metrics");
const email_service_1 = require("./email-service");
const templates_1 = require("./templates");
/**
 * Send Day 7: First Value Email
 */
async function sendDay7FirstValueEmail(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0)
            return;
        const user = users[0];
        if (!user)
            return;
        const progress = await (0, tracker_1.getOnboardingProgress)(userId);
        const hasCompletedFirstJob = progress?.steps.find((s) => s.step === "first_job" && s.completed);
        (0, logger_1.logInfo)("Sending Day 7 first value email", {
            userId: user.id,
            email: user.email,
            hasCompletedFirstJob: !!hasCompletedFirstJob,
        });
        const template = hasCompletedFirstJob ? (0, templates_1.getDay7SuccessTemplate)() : (0, templates_1.getDay7ReminderTemplate)();
        const nextStep = progress?.steps.find((s) => !s.completed)?.step || "first_job";
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: hasCompletedFirstJob
                ? "You're making great progress! 🎉"
                : "Let's get you started with Settler",
            html: (0, email_service_1.renderEmailTemplate)(template, {
                name: user.name || "there",
                hasCompletedFirstJob: hasCompletedFirstJob ? "true" : "false",
                nextStep,
                dashboardUrl: `${frontendUrl}/dashboard`,
            }),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 7 email", error, { userId });
    }
}
/**
 * Send Day 14: Progress Check Email
 */
async function sendDay14ProgressEmail(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0)
            return;
        const user = users[0];
        if (!user)
            return;
        const progress = await (0, tracker_1.getOnboardingProgress)(userId);
        const usage = await (0, metrics_1.getUserUsageMetrics)(userId, "month");
        (0, logger_1.logInfo)("Sending Day 14 progress email", {
            userId: user.id,
            email: user.email,
            completionPercentage: progress?.completionPercentage,
            reconciliations: usage.reconciliations,
        });
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: "Your Progress Update",
            html: (0, email_service_1.renderEmailTemplate)((0, templates_1.getDay14ProgressTemplate)(), {
                name: user.name || "there",
                completionPercentage: String(progress?.completionPercentage || 0),
                reconciliations: String(usage.reconciliations),
                daysRemaining: "16",
                dashboardUrl: `${frontendUrl}/dashboard`,
            }),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 14 email", error, { userId });
    }
}
/**
 * Send Day 21: Feature Deep Dive Email
 */
async function sendDay21FeatureEmail(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, plan_type
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0)
            return;
        const user = users[0];
        if (!user)
            return;
        (0, logger_1.logInfo)("Sending Day 21 feature email", {
            userId: user.id,
            email: user.email,
        });
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: "Explore Advanced Features",
            html: (0, email_service_1.renderEmailTemplate)((0, templates_1.getDay21FeatureTemplate)(), {
                name: user.name || "there",
                daysRemaining: "9",
                dashboardUrl: `${frontendUrl}/dashboard`,
            }),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 21 email", error, { userId });
    }
}
/**
 * Send Day 27: Trial Expiration Warning
 */
async function sendDay27ExpirationWarning(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, plan_type, trial_end_date
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0)
            return;
        const user = users[0];
        if (!user)
            return;
        const usage = await (0, metrics_1.getUserUsageMetrics)(userId, "month");
        (0, logger_1.logInfo)("Sending Day 27 expiration warning", {
            userId: user.id,
            email: user.email,
            reconciliations: usage.reconciliations,
        });
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: "⏰ Your Trial Ends in 3 Days",
            html: (0, email_service_1.renderEmailTemplate)((0, templates_1.getDay27ExpirationTemplate)(), {
                name: user.name || "there",
                daysRemaining: "3",
                reconciliations: String(usage.reconciliations),
                upgradeUrl: `${frontendUrl}/pricing`,
            }),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 27 email", error, { userId });
    }
}
/**
 * Send Day 29: Final Trial Reminder
 */
async function sendDay29FinalReminder(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, plan_type
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0)
            return;
        const user = users[0];
        if (!user)
            return;
        const usage = await (0, metrics_1.getUserUsageMetrics)(userId, "month");
        (0, logger_1.logInfo)("Sending Day 29 final reminder", {
            userId: user.id,
            email: user.email,
        });
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: "⚠️ Last Chance: Your Trial Ends Tomorrow",
            html: (0, email_service_1.renderEmailTemplate)((0, templates_1.getDay29FinalTemplate)(), {
                name: user.name || "there",
                daysRemaining: "1",
                reconciliations: String(usage.reconciliations),
                upgradeUrl: `${frontendUrl}/pricing`,
            }),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 29 email", error, { userId });
    }
}
/**
 * Send Day 30: Trial Ended Email
 */
async function sendDay30TrialEnded(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, plan_type
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0)
            return;
        const user = users[0];
        if (!user)
            return;
        (0, logger_1.logInfo)("Sending Day 30 trial ended email", {
            userId: user.id,
            email: user.email,
        });
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: "Your Trial Has Ended",
            html: (0, email_service_1.renderEmailTemplate)((0, templates_1.getDay30TrialEndedTemplate)(), {
                name: user.name || "there",
                upgradeUrl: `${frontendUrl}/pricing`,
                freeTierUrl: `${frontendUrl}/dashboard`,
            }),
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 30 email", error, { userId });
    }
}
/**
 * Process lifecycle email sequence
 * Sends emails based on trial days remaining
 */
async function processLifecycleEmails() {
    try {
        (0, logger_1.logInfo)("Processing lifecycle email sequence");
        const now = new Date();
        // Day 7: Users who signed up 7 days ago
        const day7 = new Date(now);
        day7.setDate(day7.getDate() - 7);
        day7.setHours(0, 0, 0, 0);
        const day7Users = await (0, db_1.query)(`SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND plan_type = 'trial'
         AND deleted_at IS NULL`, [day7]);
        for (const user of day7Users) {
            await sendDay7FirstValueEmail(user.id);
        }
        // Day 14: Users who signed up 14 days ago
        const day14 = new Date(now);
        day14.setDate(day14.getDate() - 14);
        day14.setHours(0, 0, 0, 0);
        const day14Users = await (0, db_1.query)(`SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND plan_type = 'trial'
         AND deleted_at IS NULL`, [day14]);
        for (const user of day14Users) {
            await sendDay14ProgressEmail(user.id);
        }
        // Day 21: Users who signed up 21 days ago
        const day21 = new Date(now);
        day21.setDate(day21.getDate() - 21);
        day21.setHours(0, 0, 0, 0);
        const day21Users = await (0, db_1.query)(`SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND plan_type = 'trial'
         AND deleted_at IS NULL`, [day21]);
        for (const user of day21Users) {
            await sendDay21FeatureEmail(user.id);
        }
        // Day 27: Users with 3 days left in trial
        const day27Users = await (0, db_1.query)(`SELECT id, email, name, plan_type, trial_end_date
       FROM users
       WHERE plan_type = 'trial'
         AND trial_end_date IS NOT NULL
         AND DATE(trial_end_date) = DATE(NOW() + INTERVAL '3 days')
         AND deleted_at IS NULL`, []);
        for (const user of day27Users) {
            await sendDay27ExpirationWarning(user.id);
        }
        // Day 29: Users with 1 day left in trial
        const day29Users = await (0, db_1.query)(`SELECT id, email, name, plan_type, trial_end_date
       FROM users
       WHERE plan_type = 'trial'
         AND trial_end_date IS NOT NULL
         AND DATE(trial_end_date) = DATE(NOW() + INTERVAL '1 day')
         AND deleted_at IS NULL`, []);
        for (const user of day29Users) {
            await sendDay29FinalReminder(user.id);
        }
        // Day 30: Users whose trial ended today
        const day30Users = await (0, db_1.query)(`SELECT id, email, name, plan_type, trial_end_date
       FROM users
       WHERE plan_type = 'trial'
         AND trial_end_date IS NOT NULL
         AND DATE(trial_end_date) = DATE(NOW())
         AND deleted_at IS NULL`, []);
        for (const user of day30Users) {
            await sendDay30TrialEnded(user.id);
        }
        (0, logger_1.logInfo)("Lifecycle email sequence processed", {
            day7Count: day7Users.length,
            day14Count: day14Users.length,
            day21Count: day21Users.length,
            day27Count: day27Users.length,
            day29Count: day29Users.length,
            day30Count: day30Users.length,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to process lifecycle emails", error);
    }
}
//# sourceMappingURL=lifecycle-sequences.js.map