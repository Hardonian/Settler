/**
 * Value Moments API Route
 * Detects value moments for upgrade prompts
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ moment: null });
    }

    // Get user's plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_type")
      .eq("id", user.id)
      .single();

    const typedProfile = profile as { plan_type?: string } | null;
    // Don't show prompts for paid users
    if (typedProfile?.plan_type === "commercial" || typedProfile?.plan_type === "enterprise") {
      return NextResponse.json({ moment: null });
    }

    // Check for first reconciliation
    const { data: jobs } = await supabase
      .from("reconciliation_jobs")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .limit(1);

    if (jobs && jobs.length === 1) {
      // Check if we've already shown this prompt
      const dismissed = localStorage?.getItem?.("dismissed_value_moment_first_reconciliation");
      if (!dismissed) {
        return NextResponse.json({ moment: "first_reconciliation" });
      }
    }

    // Check for approaching limit
    const { data: usage } = await supabase
      .from("usage_events")
      .select("event_type, quantity")
      .eq("user_id", user.id)
      .gte("created_at", new Date(new Date().setDate(1)).toISOString()); // This month

    if (usage) {
      const typedUsage = usage as Array<{ quantity: number | null }>;
      const totalUsage = typedUsage.reduce((sum, u) => sum + (u.quantity || 0), 0);
      const limit = typedProfile?.plan_type === "free" ? 1000 : 100000;
      const percentage = (totalUsage / limit) * 100;

      if (percentage >= 80 && percentage < 100) {
        return NextResponse.json({ moment: "approaching_limit" });
      }

      // Check for high usage
      if (typedUsage.length > 50) {
        return NextResponse.json({ moment: "high_usage" });
      }
    }

    return NextResponse.json({ moment: null });
  } catch (error) {
    console.error("Value moments error:", error);
    return NextResponse.json({ moment: null });
  }
}
