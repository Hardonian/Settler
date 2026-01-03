/**
 * Cron Job: Email Lifecycle
 *
 * Processes trial lifecycle emails daily
 * Should be called via Vercel Cron or external scheduler
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase admin client
import { createAdminClient } from "@/lib/supabase/server";
import {
  sendTrialGatedFeaturesEmail,
  sendTrialCaseStudyEmail,
  sendTrialComparisonEmail,
  sendTrialUrgencyEmail,
  sendTrialEndedEmail,
  LifecycleUser,
  TrialData,
} from "@settler/api/lib/email-lifecycle";
import { safeRpcCall } from "@/types/api";

import { logger } from "@/lib/logging/logger";
import { getEnv } from '@/lib/env';

// Verify cron secret (if using Vercel Cron)

const CRON_SECRET = getEnv('CRON_SECRET', false) || '';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const results = {
      processed: 0,
      errors: 0,
      emails: [] as string[],
    };

    // Process Day 7 emails
    interface TrialUserRow {
      id: string;
      email: string;
      name?: string | null;
      industry?: string | null;
      company_name?: string | null;
      plan_type?: string | null;
      trial_start_date?: string | null;
      trial_end_date?: string | null;
      days_remaining?: number | null;
      [key: string]: unknown;
    }
    
    const day7Result = await safeRpcCall<{ p_days_remaining: number }, TrialUserRow[]>(
      supabase,
      "get_trial_users_for_email",
      { p_days_remaining: 7 }
    );
    if (day7Result.data && Array.isArray(day7Result.data)) {
      for (const user of day7Result.data) {
        try {
          // Skip if required fields are missing
          if (!user.trial_start_date || !user.trial_end_date || user.days_remaining === null || user.days_remaining === undefined) {
            continue;
          }

          const trialData: TrialData = {
            trialStartDate: user.trial_start_date,
            trialEndDate: user.trial_end_date,
            daysRemaining: user.days_remaining,
          };

          const lifecycleUser: LifecycleUser = {
            email: user.email,
            firstName: user.name?.split(" ")[0] ?? undefined,
            industry: user.industry ?? undefined,
            companyName: user.company_name ?? undefined,
            planType: (user.plan_type as "free" | "trial" | "commercial" | "enterprise") ?? undefined,
          };

          await sendTrialGatedFeaturesEmail(lifecycleUser, trialData);

          // Update email tracking
          await safeRpcCall<{ p_user_id: string; p_email_type: string }, unknown>(
            supabase,
            "update_email_sent",
            { p_user_id: user.id, p_email_type: "trial_day7" }
          );

          results.processed++;
          results.emails.push(user.email);
        } catch (error) {
          logger.error("Failed to send Day 7 email", error instanceof Error ? error : new Error(String(error)), { user: user.email });
          results.errors++;
        }
      }
    }

    // Process Day 14 emails
    const day14Result = await safeRpcCall<{ p_days_remaining: number }, TrialUserRow[]>(
      supabase,
      "get_trial_users_for_email",
      { p_days_remaining: 14 }
    );
    if (day14Result.data && Array.isArray(day14Result.data)) {
      for (const user of day14Result.data) {
        try {
          // Skip if required fields are missing
          if (!user.trial_start_date || !user.trial_end_date || user.days_remaining === null || user.days_remaining === undefined) {
            continue;
          }

          const trialData: TrialData = {
            trialStartDate: user.trial_start_date,
            trialEndDate: user.trial_end_date,
            daysRemaining: user.days_remaining,
          };

          const lifecycleUser: LifecycleUser = {
            email: user.email,
            firstName: user.name?.split(" ")[0] ?? undefined,
            industry: user.industry ?? undefined,
            companyName: user.company_name ?? undefined,
            planType: (user.plan_type as "free" | "trial" | "commercial" | "enterprise") ?? undefined,
          };

          await sendTrialCaseStudyEmail(lifecycleUser, trialData, {
            companyName: "Example Company",
            caseStudyUrl: `${getEnv('APP_URL', false) || "https://app.settler.dev"}/case-studies/example`,
          });

          await safeRpcCall<{ p_user_id: string; p_email_type: string }, unknown>(
            supabase,
            "update_email_sent",
            { p_user_id: user.id, p_email_type: "trial_day14" }
          );

          results.processed++;
          results.emails.push(user.email);
        } catch (error) {
          logger.error("Failed to send Day 14 email", error instanceof Error ? error : new Error(String(error)), { user: user.email });
          results.errors++;
        }
      }
    }

    // Process Day 21 emails (9 days remaining)
    const day21Result = await safeRpcCall<{ p_days_remaining: number }, TrialUserRow[]>(
      supabase,
      "get_trial_users_for_email",
      { p_days_remaining: 9 }
    );
    if (day21Result.data && Array.isArray(day21Result.data)) {
      for (const user of day21Result.data) {
        try {
          // Skip if required fields are missing
          if (!user.trial_start_date || !user.trial_end_date || user.days_remaining === null || user.days_remaining === undefined) {
            continue;
          }

          const trialData: TrialData = {
            trialStartDate: user.trial_start_date,
            trialEndDate: user.trial_end_date,
            daysRemaining: user.days_remaining,
          };

          const lifecycleUser: LifecycleUser = {
            email: user.email,
            firstName: user.name?.split(" ")[0] ?? undefined,
            industry: user.industry ?? undefined,
            companyName: user.company_name ?? undefined,
            planType: (user.plan_type as "free" | "trial" | "commercial" | "enterprise") ?? undefined,
          };

          await sendTrialComparisonEmail(lifecycleUser, trialData);

          await safeRpcCall<{ p_user_id: string; p_email_type: string }, unknown>(
            supabase,
            "update_email_sent",
            { p_user_id: user.id, p_email_type: "trial_day21" }
          );

          results.processed++;
          results.emails.push(user.email);
        } catch (error) {
          logger.error("Failed to send Day 21 email", error instanceof Error ? error : new Error(String(error)), { user: user.email });
          results.errors++;
        }
      }
    }

    // Process Day 27-29 emails
    for (const day of [27, 28, 29]) {
      const daysRemaining = day === 27 ? 3 : day === 28 ? 2 : 1;
      const result = await safeRpcCall<{ p_days_remaining: number }, TrialUserRow[]>(
        supabase,
        "get_trial_users_for_email",
        { p_days_remaining: daysRemaining }
      );

      if (result.data && Array.isArray(result.data)) {
        for (const user of result.data) {
          try {
            // Skip if required fields are missing
            if (!user.trial_start_date || !user.trial_end_date || user.days_remaining === null || user.days_remaining === undefined) {
              continue;
            }

            const trialData: TrialData = {
              trialStartDate: user.trial_start_date,
              trialEndDate: user.trial_end_date,
              daysRemaining: user.days_remaining,
            };

            const lifecycleUser: LifecycleUser = {
              email: user.email,
              firstName: user.name?.split(" ")[0] ?? undefined,
              industry: user.industry ?? undefined,
              companyName: user.company_name ?? undefined,
              planType: (user.plan_type as "free" | "trial" | "commercial" | "enterprise") ?? undefined,
            };

            await sendTrialUrgencyEmail(lifecycleUser, trialData, day as 27 | 28 | 29);

            await safeRpcCall<{ p_user_id: string; p_email_type: string }, unknown>(
              supabase,
              "update_email_sent",
              { p_user_id: user.id, p_email_type: `trial_day${day}` }
            );

            results.processed++;
            results.emails.push(user.email);
          } catch (error) {
            logger.error(`Failed to send Day ${day} email`, error instanceof Error ? error : new Error(String(error)), { user: user.email });
            results.errors++;
          }
        }
      }
    }

    // Process Day 30 (trial ended)
    const day30Result = await safeRpcCall<{ p_days_remaining: number }, TrialUserRow[]>(
      supabase,
      "get_trial_users_for_email",
      { p_days_remaining: 0 }
    );
    if (day30Result.data && Array.isArray(day30Result.data)) {
      for (const user of day30Result.data) {
        try {
          const lifecycleUser: LifecycleUser = {
            email: user.email,
            firstName: user.name?.split(" ")[0] ?? undefined,
            industry: user.industry ?? undefined,
            companyName: user.company_name ?? undefined,
            planType: (user.plan_type as "free" | "trial" | "commercial" | "enterprise") ?? undefined,
          };

          await sendTrialEndedEmail(lifecycleUser);

          // Update plan to free if not upgraded
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("profiles") as any)
            .update({ plan_type: "free" })
            .eq("id", user.id)
            .eq("plan_type", "trial");

          await safeRpcCall<{ p_user_id: string; p_email_type: string }, unknown>(
            supabase,
            "update_email_sent",
            { p_user_id: user.id, p_email_type: "trial_ended" }
          );

          results.processed++;
          results.emails.push(user.email);
        } catch (error) {
          logger.error("Failed to send trial ended email", error instanceof Error ? error : new Error(String(error)), { user: user.email });
          results.errors++;
        }
      }
    }

    logger.info("Email lifecycle cron job completed", {
      processed: results.processed,
      errors: results.errors,
      emailCount: results.emails.length,
    });

    return NextResponse.json({
      success: true,
      processed: results.processed,
      errors: results.errors,
      emails: results.emails,
    });
  } catch (error) {
    logger.error("Email lifecycle cron job failed", error instanceof Error ? error : new Error(String(error)));
    // Never return 500 - return graceful error response (cron can retry)
    return NextResponse.json(
      { 
        success: false,
        processed: 0,
        errors: 1,
        emails: [],
        error: "Failed to process email lifecycle",
        message: "Cron job will retry on next schedule"
      },
      { status: 200 }
    );
  }
}
