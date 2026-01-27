"use strict";
/**
 * Onboarding Email Sequence
 * Automated email sequences for new users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDay0WelcomeEmail = sendDay0WelcomeEmail;
exports.sendDay1OnboardingEmail = sendDay1OnboardingEmail;
exports.sendDay3ActivationEmail = sendDay3ActivationEmail;
exports.processOnboardingEmails = processOnboardingEmails;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const tracker_1 = require("../onboarding/tracker");
const email_1 = require("../../lib/email");
/**
 * Send Day 0 welcome email
 */
async function sendDay0WelcomeEmail(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, created_at, plan_type
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0) {
            (0, logger_1.logError)("User not found for welcome email", new Error("User not found"), { userId });
            return;
        }
        const user = users[0];
        if (!user)
            return;
        (0, logger_1.logInfo)("Sending Day 0 welcome email", {
            userId: user.id,
            email: user.email,
        });
        // Send welcome email via Resend
        try {
            await (0, email_1.sendWelcomeEmail)(user.email, user.name || undefined, process.env.NEXT_PUBLIC_APP_URL || 'https://app.settler.dev');
            (0, logger_1.logInfo)("Day 0 welcome email sent successfully", { userId: user.id, email: user.email });
        }
        catch (emailError) {
            (0, logger_1.logError)("Failed to send Day 0 welcome email", emailError, { userId: user.id });
            // Don't throw - email failure shouldn't break onboarding
        }
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 0 welcome email", error, { userId });
    }
}
/**
 * Send Day 1 onboarding email
 */
async function sendDay1OnboardingEmail(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, plan_type
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0)
            return;
        const user = users[0];
        if (!user)
            return;
        const progress = await (0, tracker_1.getOnboardingProgress)(userId);
        const nextStep = progress?.steps.find((s) => !s.completed);
        (0, logger_1.logInfo)("Sending Day 1 onboarding email", {
            userId: user.id,
            email: user.email,
            nextStep: nextStep?.step,
        });
        // Send Day 1 onboarding email
        try {
            const progressPercent = progress?.completionPercentage || 0;
            const nextStepText = nextStep?.step || 'Get started';
            const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.settler.dev'}/dashboard`;
            await (0, email_1.sendNotificationEmail)(user.email, 'Continue your Settler setup', `Hi ${user.name || 'there'},\n\nYou're ${progressPercent}% complete with onboarding. Your next step: ${nextStepText}.\n\nContinue your setup:`, dashboardUrl, 'Go to Dashboard', user.name || undefined);
            (0, logger_1.logInfo)("Day 1 onboarding email sent successfully", { userId: user.id });
        }
        catch (emailError) {
            (0, logger_1.logError)("Failed to send Day 1 onboarding email", emailError, { userId: user.id });
        }
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 1 onboarding email", error, { userId });
    }
}
/**
 * Send Day 3 activation email
 */
async function sendDay3ActivationEmail(userId) {
    try {
        const users = await (0, db_1.query)(`SELECT id, email, name, plan_type
       FROM users
       WHERE id = $1`, [userId]);
        if (users.length === 0)
            return;
        const user = users[0];
        if (!user)
            return;
        const isComplete = await (0, tracker_1.isOnboardingComplete)(userId);
        (0, logger_1.logInfo)("Sending Day 3 activation email", {
            userId: user.id,
            email: user.email,
            onboardingComplete: isComplete,
        });
        // Send Day 3 activation email
        try {
            const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.settler.dev'}/dashboard`;
            if (isComplete) {
                await (0, email_1.sendNotificationEmail)(user.email, '🎉 Onboarding Complete!', `Hi ${user.name || 'there'},\n\nCongratulations! You've completed onboarding and your account is fully activated.\n\nStart reconciling:`, dashboardUrl, 'Go to Dashboard', user.name || undefined);
            }
            else {
                await (0, email_1.sendNotificationEmail)(user.email, 'Complete your Settler setup', `Hi ${user.name || 'there'},\n\nYou're almost there! Complete your setup to start using Settler.\n\nFinish setup:`, dashboardUrl, 'Complete Setup', user.name || undefined);
            }
            (0, logger_1.logInfo)("Day 3 activation email sent successfully", { userId: user.id, isComplete });
        }
        catch (emailError) {
            (0, logger_1.logError)("Failed to send Day 3 activation email", emailError, { userId: user.id });
        }
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send Day 3 activation email", error, { userId });
    }
}
/**
 * Process onboarding email sequence
 * Sends emails based on user signup date
 */
async function processOnboardingEmails() {
    try {
        (0, logger_1.logInfo)("Processing onboarding email sequence");
        const now = new Date();
        const day0 = new Date(now);
        day0.setDate(day0.getDate() - 0);
        day0.setHours(0, 0, 0, 0);
        const day1 = new Date(now);
        day1.setDate(day1.getDate() - 1);
        day1.setHours(0, 0, 0, 0);
        const day3 = new Date(now);
        day3.setDate(day3.getDate() - 3);
        day3.setHours(0, 0, 0, 0);
        // Day 0: Users who signed up today
        const day0Users = await (0, db_1.query)(`SELECT id, email, name, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND deleted_at IS NULL`, [day0]);
        for (const user of day0Users) {
            await sendDay0WelcomeEmail(user.id);
        }
        // Day 1: Users who signed up yesterday
        const day1Users = await (0, db_1.query)(`SELECT id, email, name, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND deleted_at IS NULL`, [day1]);
        for (const user of day1Users) {
            await sendDay1OnboardingEmail(user.id);
        }
        // Day 3: Users who signed up 3 days ago
        const day3Users = await (0, db_1.query)(`SELECT id, email, name, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND deleted_at IS NULL`, [day3]);
        for (const user of day3Users) {
            await sendDay3ActivationEmail(user.id);
        }
        (0, logger_1.logInfo)("Onboarding email sequence processed", {
            day0Count: day0Users.length,
            day1Count: day1Users.length,
            day3Count: day3Users.length,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to process onboarding emails", error);
    }
}
//# sourceMappingURL=onboarding-sequence.js.map