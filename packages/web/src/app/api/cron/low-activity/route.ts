/**
 * Cron Job: Low Activity Emails
 *
 * Sends low activity nudge emails to inactive paid users
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createAdminClient } from "@/lib/supabase/server";
import { sendLowActivityEmail, LifecycleUser } from "@settler/api/lib/email-lifecycle";


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

    // Get inactive users (7+ days)
    const { data: users, error } = (await supabase.rpc("get_inactive_users", {
      p_days_inactive: 7,
    } as any)) as { data: any[] | null; error: any };

    if (error) {
      logger.error("Failed to fetch inactive users", error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const results = {
      processed: 0,
      errors: 0,
      emails: [] as string[],
    };

    for (const user of (Array.isArray(users) ? users : []) || []) {
      try {
        // Skip if we sent a low activity email in the last 14 days
        const { data: profile } = (await supabase
          .from("profiles")
          .select("last_email_sent_at, last_email_type")
          .eq("id", user.id)
          .single()) as { data: any; error: any };

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
          planType: user.plan_type,
        };

        await sendLowActivityEmail(lifecycleUser);

        await supabase.rpc("update_email_sent", {
          p_user_id: user.id,
          p_email_type: "low_activity",
        } as any);

        results.processed++;
        results.emails.push(user.email);
      } catch (error) {
        logger.error("Failed to send low activity email", error instanceof Error ? error : new Error(String(error)), { user: user.email });
        results.errors++;
      }
    }

    logInfo("Low activity cron job completed", {
      processed: results.processed,
      errors: results.errors,
    });

    return NextResponse.json({
      success: true,
      processed: results.processed,
      errors: results.errors,
    });
  } catch (error) {
    logger.error("Low activity cron job failed", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
