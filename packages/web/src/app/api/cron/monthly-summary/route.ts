/**
 * Cron Job: Monthly Summary Emails
 *
 * Sends monthly summary emails to paid users on the 1st of each month
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase admin client
import { createAdminClient } from "@/lib/supabase/server";
import { sendMonthlySummaryEmail, LifecycleUser } from "@settler/api/lib/email-lifecycle";


import { logger } from "@/lib/logging/logger";

import { getEnv } from '@/lib/env';

const CRON_SECRET = getEnv('CRON_SECRET', false) || '';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Get paid users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: users, error } = (await supabase.rpc(
      "get_paid_users_for_monthly_summary" as any
    )) as { data: Array<{
      id: string;
      email: string;
      name?: string;
      industry?: string;
      company_name?: string;
      plan_type?: string;
    }> | null; error: { message?: string } | null };

    if (error) {
      logger.error("Failed to fetch paid users", error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    const results = {
      processed: 0,
      errors: 0,
      emails: [] as string[],
    };

    // Calculate last month's date range (unused but kept for future use)
    // const now = new Date();
    // const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    for (const user of (Array.isArray(users) ? users : []) || []) {
      try {
        // In production, calculate actual metrics from reconciliation jobs
        // For now, use placeholder metrics
        const metrics = {
          totalReconciliations: 0, // Calculate from jobs table
          accuracy: 98.5, // Calculate from reconciliation results
          timeSaved: 0, // Calculate from job history
          jobsCreated: 0, // Count from jobs table
          topInsight1: "Your reconciliation accuracy improved this month",
          topInsight2: "Consider setting up scheduled reconciliations for better efficiency",
          recommendation1: "Try the real-time webhook workflow",
          recommendation2: "Explore multi-currency reconciliation",
        };

        const lifecycleUser: LifecycleUser = {
          email: user.email,
          firstName: user.name?.split(" ")[0],
          industry: user.industry,
          companyName: user.company_name,
          planType: user.plan_type as "free" | "enterprise" | "trial" | "commercial" | undefined,
        };

        await sendMonthlySummaryEmail(lifecycleUser, metrics);

        await (supabase.rpc as any)("update_email_sent", {
          p_user_id: user.id,
          p_email_type: "monthly_summary",
        });

        results.processed++;
        results.emails.push(user.email);
      } catch (error) {
        logger.error("Failed to send monthly summary", error instanceof Error ? error : new Error(String(error)), { user: user.email });
        results.errors++;
      }
    }

    logger.info("Monthly summary cron job completed", {
      processed: results.processed,
      errors: results.errors,
    });

    return NextResponse.json({
      success: true,
      processed: results.processed,
      errors: results.errors,
    });
  } catch (error) {
    logger.error("Monthly summary cron job failed", error instanceof Error ? error : new Error(String(error)));
    // Never return 500 - return graceful error response (cron can retry)
    return NextResponse.json(
      { 
        success: false,
        processed: 0,
        errors: 1,
        error: "Failed to process monthly summary",
        message: "Cron job will retry on next schedule"
      },
      { status: 200 }
    );
  }
}
