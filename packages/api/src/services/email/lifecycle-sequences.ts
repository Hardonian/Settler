/**
 * Complete Lifecycle Email Sequences
 * Day 7, 14, 21, 27, 29, 30 emails for trial users
 */

import { query } from "../../db";
import { logInfo, logError } from "../../utils/logger";
import { getOnboardingProgress } from "../onboarding/tracker";
import { getUserUsageMetrics } from "../analytics/metrics";
import { sendEmail, renderEmailTemplate } from "./email-service";
import {
  getDay7SuccessTemplate,
  getDay7ReminderTemplate,
  getDay14ProgressTemplate,
  getDay21FeatureTemplate,
  getDay27ExpirationTemplate,
  getDay29FinalTemplate,
  getDay30TrialEndedTemplate,
} from "./templates";

interface User {
  id: string;
  email: string;
  name?: string;
  plan_type: string;
  created_at: Date;
  trial_end_date?: Date;
}

/**
 * Send Day 7: First Value Email
 */
export async function sendDay7FirstValueEmail(userId: string): Promise<void> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (users.length === 0) return;
    const user = users[0];
    if (!user) return;

    const progress = await getOnboardingProgress(userId);
    const hasCompletedFirstJob = progress?.steps.find((s) => s.step === "first_job" && s.completed);

    logInfo("Sending Day 7 first value email", {
      userId: user.id,
      email: user.email,
      hasCompletedFirstJob: !!hasCompletedFirstJob,
    });

    const template = hasCompletedFirstJob ? getDay7SuccessTemplate() : getDay7ReminderTemplate();

    const nextStep = progress?.steps.find((s) => !s.completed)?.step || "first_job";
    const frontendUrl =
      process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";

    await sendEmail({
      to: user.email,
      subject: hasCompletedFirstJob
        ? "You're making great progress! 🎉"
        : "Let's get you started with Settler",
      html: renderEmailTemplate(template, {
        name: user.name || "there",
        hasCompletedFirstJob: hasCompletedFirstJob ? "true" : "false",
        nextStep,
        dashboardUrl: `${frontendUrl}/dashboard`,
      }),
    });
  } catch (error) {
    logError("Failed to send Day 7 email", error, { userId });
  }
}

/**
 * Send Day 14: Progress Check Email
 */
export async function sendDay14ProgressEmail(userId: string): Promise<void> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (users.length === 0) return;
    const user = users[0];
    if (!user) return;

    const progress = await getOnboardingProgress(userId);
    const usage = await getUserUsageMetrics(userId, "month");

    logInfo("Sending Day 14 progress email", {
      userId: user.id,
      email: user.email,
      completionPercentage: progress?.completionPercentage,
      reconciliations: usage.reconciliations,
    });

    const frontendUrl =
      process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";

    await sendEmail({
      to: user.email,
      subject: "Your Progress Update",
      html: renderEmailTemplate(getDay14ProgressTemplate(), {
        name: user.name || "there",
        completionPercentage: String(progress?.completionPercentage || 0),
        reconciliations: String(usage.reconciliations),
        daysRemaining: "16",
        dashboardUrl: `${frontendUrl}/dashboard`,
      }),
    });
  } catch (error) {
    logError("Failed to send Day 14 email", error, { userId });
  }
}

/**
 * Send Day 21: Feature Deep Dive Email
 */
export async function sendDay21FeatureEmail(userId: string): Promise<void> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, plan_type
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (users.length === 0) return;
    const user = users[0];
    if (!user) return;

    logInfo("Sending Day 21 feature email", {
      userId: user.id,
      email: user.email,
    });

    const frontendUrl =
      process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";

    await sendEmail({
      to: user.email,
      subject: "Explore Advanced Features",
      html: renderEmailTemplate(getDay21FeatureTemplate(), {
        name: user.name || "there",
        daysRemaining: "9",
        dashboardUrl: `${frontendUrl}/dashboard`,
      }),
    });
  } catch (error) {
    logError("Failed to send Day 21 email", error, { userId });
  }
}

/**
 * Send Day 27: Trial Expiration Warning
 */
export async function sendDay27ExpirationWarning(userId: string): Promise<void> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, plan_type, trial_end_date
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (users.length === 0) return;
    const user = users[0];
    if (!user) return;

    const usage = await getUserUsageMetrics(userId, "month");

    logInfo("Sending Day 27 expiration warning", {
      userId: user.id,
      email: user.email,
      reconciliations: usage.reconciliations,
    });

    const frontendUrl =
      process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";

    await sendEmail({
      to: user.email,
      subject: "⏰ Your Trial Ends in 3 Days",
      html: renderEmailTemplate(getDay27ExpirationTemplate(), {
        name: user.name || "there",
        daysRemaining: "3",
        reconciliations: String(usage.reconciliations),
        upgradeUrl: `${frontendUrl}/pricing`,
      }),
    });
  } catch (error) {
    logError("Failed to send Day 27 email", error, { userId });
  }
}

/**
 * Send Day 29: Final Trial Reminder
 */
export async function sendDay29FinalReminder(userId: string): Promise<void> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, plan_type
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (users.length === 0) return;
    const user = users[0];
    if (!user) return;

    const usage = await getUserUsageMetrics(userId, "month");

    logInfo("Sending Day 29 final reminder", {
      userId: user.id,
      email: user.email,
    });

    const frontendUrl =
      process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";

    await sendEmail({
      to: user.email,
      subject: "⚠️ Last Chance: Your Trial Ends Tomorrow",
      html: renderEmailTemplate(getDay29FinalTemplate(), {
        name: user.name || "there",
        daysRemaining: "1",
        reconciliations: String(usage.reconciliations),
        upgradeUrl: `${frontendUrl}/pricing`,
      }),
    });
  } catch (error) {
    logError("Failed to send Day 29 email", error, { userId });
  }
}

/**
 * Send Day 30: Trial Ended Email
 */
export async function sendDay30TrialEnded(userId: string): Promise<void> {
  try {
    const users = await query<User>(
      `SELECT id, email, name, plan_type
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (users.length === 0) return;
    const user = users[0];
    if (!user) return;

    logInfo("Sending Day 30 trial ended email", {
      userId: user.id,
      email: user.email,
    });

    const frontendUrl =
      process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";

    await sendEmail({
      to: user.email,
      subject: "Your Trial Has Ended",
      html: renderEmailTemplate(getDay30TrialEndedTemplate(), {
        name: user.name || "there",
        upgradeUrl: `${frontendUrl}/pricing`,
        freeTierUrl: `${frontendUrl}/dashboard`,
      }),
    });
  } catch (error) {
    logError("Failed to send Day 30 email", error, { userId });
  }
}

/**
 * Process lifecycle email sequence
 * Sends emails based on trial days remaining
 */
export async function processLifecycleEmails(): Promise<void> {
  try {
    logInfo("Processing lifecycle email sequence");

    const now = new Date();

    // Day 7: Users who signed up 7 days ago
    const day7 = new Date(now);
    day7.setDate(day7.getDate() - 7);
    day7.setHours(0, 0, 0, 0);

    const day7Users = await query<User>(
      `SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND plan_type = 'trial'
         AND deleted_at IS NULL`,
      [day7]
    );

    for (const user of day7Users) {
      await sendDay7FirstValueEmail(user.id);
    }

    // Day 14: Users who signed up 14 days ago
    const day14 = new Date(now);
    day14.setDate(day14.getDate() - 14);
    day14.setHours(0, 0, 0, 0);

    const day14Users = await query<User>(
      `SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND plan_type = 'trial'
         AND deleted_at IS NULL`,
      [day14]
    );

    for (const user of day14Users) {
      await sendDay14ProgressEmail(user.id);
    }

    // Day 21: Users who signed up 21 days ago
    const day21 = new Date(now);
    day21.setDate(day21.getDate() - 21);
    day21.setHours(0, 0, 0, 0);

    const day21Users = await query<User>(
      `SELECT id, email, name, plan_type, created_at
       FROM users
       WHERE DATE(created_at) = DATE($1)
         AND plan_type = 'trial'
         AND deleted_at IS NULL`,
      [day21]
    );

    for (const user of day21Users) {
      await sendDay21FeatureEmail(user.id);
    }

    // Day 27: Users with 3 days left in trial
    const day27Users = await query<User>(
      `SELECT id, email, name, plan_type, trial_end_date
       FROM users
       WHERE plan_type = 'trial'
         AND trial_end_date IS NOT NULL
         AND DATE(trial_end_date) = DATE(NOW() + INTERVAL '3 days')
         AND deleted_at IS NULL`,
      []
    );

    for (const user of day27Users) {
      await sendDay27ExpirationWarning(user.id);
    }

    // Day 29: Users with 1 day left in trial
    const day29Users = await query<User>(
      `SELECT id, email, name, plan_type, trial_end_date
       FROM users
       WHERE plan_type = 'trial'
         AND trial_end_date IS NOT NULL
         AND DATE(trial_end_date) = DATE(NOW() + INTERVAL '1 day')
         AND deleted_at IS NULL`,
      []
    );

    for (const user of day29Users) {
      await sendDay29FinalReminder(user.id);
    }

    // Day 30: Users whose trial ended today
    const day30Users = await query<User>(
      `SELECT id, email, name, plan_type, trial_end_date
       FROM users
       WHERE plan_type = 'trial'
         AND trial_end_date IS NOT NULL
         AND DATE(trial_end_date) = DATE(NOW())
         AND deleted_at IS NULL`,
      []
    );

    for (const user of day30Users) {
      await sendDay30TrialEnded(user.id);
    }

    logInfo("Lifecycle email sequence processed", {
      day7Count: day7Users.length,
      day14Count: day14Users.length,
      day21Count: day21Users.length,
      day27Count: day27Users.length,
      day29Count: day29Users.length,
      day30Count: day30Users.length,
    });
  } catch (error) {
    logError("Failed to process lifecycle emails", error);
  }
}
