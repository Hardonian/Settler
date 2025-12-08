/**
 * Cron Job: Email Lifecycle
 *
 * Processes trial lifecycle emails daily
 * Should be called via Vercel Cron or external scheduler
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
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

// Simple logger for web package
const logInfo = (message: string, meta?: Record<string, unknown>) => {
  console.log(`[INFO] ${message}`, meta || "");
};

const logError = (message: string, error?: Error, meta?: Record<string, unknown>) => {
  console.error(`[ERROR] ${message}`, { error: error?.message, ...meta });
};

// Verify cron secret (if using Vercel Cron)
const CRON_SECRET = process.env.CRON_SECRET;

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
    const day7Result = (await supabase.rpc("get_trial_users_for_email", {
      p_days_remaining: 7,
    } as any)) as { data: any[] | null; error: any };
    if (day7Result.data && Array.isArray(day7Result.data)) {
      for (const user of day7Result.data) {
        try {
          const trialData: TrialData = {
            trialStartDate: user.trial_start_date,
            trialEndDate: user.trial_end_date,
            daysRemaining: user.days_remaining,
          };

          const lifecycleUser: LifecycleUser = {
            email: user.email,
            firstName: user.name?.split(" ")[0],
            industry: user.industry,
            companyName: user.company_name,
            planType: user.plan_type,
          };

          await sendTrialGatedFeaturesEmail(lifecycleUser, trialData);

          // Update email tracking
          await supabase.rpc("update_email_sent", {
            p_user_id: user.id,
            p_email_type: "trial_day7",
          } as any);

          results.processed++;
          results.emails.push(user.email);
        } catch (error) {
          logError("Failed to send Day 7 email", error as Error, { user: user.email });
          results.errors++;
        }
      }
    }

    // Process Day 14 emails
    const day14Result = (await supabase.rpc("get_trial_users_for_email", {
      p_days_remaining: 14,
    } as any)) as { data: any[] | null; error: any };
    if (day14Result.data && Array.isArray(day14Result.data)) {
      for (const user of day14Result.data) {
        try {
          const trialData: TrialData = {
            trialStartDate: user.trial_start_date,
            trialEndDate: user.trial_end_date,
            daysRemaining: user.days_remaining,
          };

          const lifecycleUser: LifecycleUser = {
            email: user.email,
            firstName: user.name?.split(" ")[0],
            industry: user.industry,
            companyName: user.company_name,
            planType: user.plan_type,
          };

          await sendTrialCaseStudyEmail(lifecycleUser, trialData, {
            companyName: "Example Company",
            caseStudyUrl: `${process.env.APP_URL || "https://app.settler.dev"}/case-studies/example`,
          });

          await supabase.rpc("update_email_sent", {
            p_user_id: user.id,
            p_email_type: "trial_day14",
          } as any);

          results.processed++;
          results.emails.push(user.email);
        } catch (error) {
          logError("Failed to send Day 14 email", error as Error, { user: user.email });
          results.errors++;
        }
      }
    }

    // Process Day 21 emails (9 days remaining)
    const day21Result = (await supabase.rpc("get_trial_users_for_email", {
      p_days_remaining: 9,
    } as any)) as { data: any[] | null; error: any };
    if (day21Result.data && Array.isArray(day21Result.data)) {
      for (const user of day21Result.data) {
        try {
          const trialData: TrialData = {
            trialStartDate: user.trial_start_date,
            trialEndDate: user.trial_end_date,
            daysRemaining: user.days_remaining,
          };

          const lifecycleUser: LifecycleUser = {
            email: user.email,
            firstName: user.name?.split(" ")[0],
            industry: user.industry,
            companyName: user.company_name,
            planType: user.plan_type,
          };

          await sendTrialComparisonEmail(lifecycleUser, trialData);

          await supabase.rpc("update_email_sent", {
            p_user_id: user.id,
            p_email_type: "trial_day21",
          } as any);

          results.processed++;
          results.emails.push(user.email);
        } catch (error) {
          logError("Failed to send Day 21 email", error as Error, { user: user.email });
          results.errors++;
        }
      }
    }

    // Process Day 27-29 emails
    for (const day of [27, 28, 29]) {
      const daysRemaining = day === 27 ? 3 : day === 28 ? 2 : 1;
      const result = (await supabase.rpc("get_trial_users_for_email", {
        p_days_remaining: daysRemaining,
      } as any)) as { data: any[] | null; error: any };

      if (result.data && Array.isArray(result.data)) {
        for (const user of result.data) {
          try {
            const trialData: TrialData = {
              trialStartDate: user.trial_start_date,
              trialEndDate: user.trial_end_date,
              daysRemaining: user.days_remaining,
            };

            const lifecycleUser: LifecycleUser = {
              email: user.email,
              firstName: user.name?.split(" ")[0],
              industry: user.industry,
              companyName: user.company_name,
              planType: user.plan_type,
            };

            await sendTrialUrgencyEmail(lifecycleUser, trialData, day as 27 | 28 | 29);

            await supabase.rpc("update_email_sent", {
              p_user_id: user.id,
              p_email_type: `trial_day${day}`,
            } as any);

            results.processed++;
            results.emails.push(user.email);
          } catch (error) {
            logError(`Failed to send Day ${day} email`, error as Error, { user: user.email });
            results.errors++;
          }
        }
      }
    }

    // Process Day 30 (trial ended)
    const day30Result = (await supabase.rpc("get_trial_users_for_email", {
      p_days_remaining: 0,
    } as any)) as { data: any[] | null; error: any };
    if (day30Result.data && Array.isArray(day30Result.data)) {
      for (const user of day30Result.data) {
        try {
          const lifecycleUser: LifecycleUser = {
            email: user.email,
            firstName: user.name?.split(" ")[0],
            industry: user.industry,
            companyName: user.company_name,
            planType: user.plan_type,
          };

          await sendTrialEndedEmail(lifecycleUser);

          // Update plan to free if not upgraded
          await (supabase.from("profiles") as any)
            .update({ plan_type: "free" })
            .eq("id", user.id)
            .eq("plan_type", "trial");

          await supabase.rpc("update_email_sent", {
            p_user_id: user.id,
            p_email_type: "trial_ended",
          } as any);

          results.processed++;
          results.emails.push(user.email);
        } catch (error) {
          logError("Failed to send trial ended email", error as Error, { user: user.email });
          results.errors++;
        }
      }
    }

    logInfo("Email lifecycle cron job completed", {
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
    logError("Email lifecycle cron job failed", error as Error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
