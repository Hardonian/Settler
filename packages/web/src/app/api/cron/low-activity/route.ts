/**
 * Cron Job: Low Activity Emails
 *
 * Sends low activity nudge emails to inactive paid users
 */

// ROUTE_CLASS: cron-internal
// AUTH: CRON_SECRET bearer token — fail-closed in production

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Supabase admin client
import { createAdminClient } from "@/lib/supabase/server";
import { sendLowActivityEmail, LifecycleUser } from "@settler/api";

import { logger } from "@/lib/logging/logger";

import { getEnv } from "@/lib/env";

const CRON_SECRET = getEnv("CRON_SECRET", false) || "";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret — fail closed: if CRON_SECRET is unset, only allow in development
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || CRON_SECRET;
    if (!cronSecret) {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { error: "Unauthorized: CRON_SECRET not configured" },
          { status: 401 }
        );
      }
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Get inactive users (7+ days)
    const result = await (supabase.rpc as any)("get_inactive_users", {
      p_days_inactive: 7,
    });
    const { data: users, error } = result as {
      data: Array<{
        id: string;
        email: string;
        name?: string;
        industry?: string;
        company_name?: string;
        plan_type?: string;
      }> | null;
      error: { message?: string } | null;
    };

    if (error) {
      logger.error(
        "Failed to fetch inactive users",
        error instanceof Error ? error : new Error(String(error))
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch users",
          message: "Please try again later or contact support if the issue persists",
        },
        { status: 200 }
      );
    }

    const results = {
      processed: 0,
      errors: 0,
      emails: [] as string[],
    };

    for (const user of (Array.isArray(users) ? users : []) || []) {
      try {
        // Skip if we sent a low activity email in the last 14 days
        const profileResult = await ((supabase.from("profiles") as any)
          .select("last_email_sent_at, last_email_type")
          .eq("id", user.id)
          .single() as Promise<{
          data: {
            last_email_sent_at?: string;
            last_email_type?: string;
          } | null;
          error: { message?: string } | null;
        }>);
        const { data: profile } = profileResult;

        if (profile?.last_email_type === "low_activity" && profile?.last_email_sent_at) {
          const daysSinceLastEmail = Math.floor(
            (Date.now() - new Date(profile.last_email_sent_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastEmail < 14) {
            continue; // Skip if we sent recently
          }
        }

        const lifecycleUser: LifecycleUser = {
          email: user.email,
          firstName: user.name?.split(" ")[0],
          industry: user.industry,
          companyName: user.company_name,
          planType: user.plan_type as "free" | "enterprise" | "trial" | "commercial" | undefined,
        };

        await sendLowActivityEmail(lifecycleUser);

        await (supabase.rpc as any)("update_email_sent", {
          p_user_id: user.id,
          p_email_type: "low_activity",
        });

        results.processed++;
        results.emails.push(user.email);
      } catch (error) {
        logger.error(
          "Failed to send low activity email",
          error instanceof Error ? error : new Error(String(error)),
          { user: user.email }
        );
        results.errors++;
      }
    }

    logger.info("Low activity cron job completed", {
      processed: results.processed,
      errors: results.errors,
    });

    return NextResponse.json({
      success: true,
      processed: results.processed,
      errors: results.errors,
    });
  } catch (error) {
    logger.error(
      "Low activity cron job failed",
      error instanceof Error ? error : new Error(String(error))
    );
    // Never return 500 - return graceful error response (cron can retry)
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        errors: 1,
        error: "Failed to process low activity check",
        message: "Cron job will retry on next schedule",
      },
      { status: 200 }
    );
  }
}
