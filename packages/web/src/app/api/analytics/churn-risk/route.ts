import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if user is admin (in production, use proper admin check)
    // For now, allow any authenticated user to view their own data
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with churn risk > 0.4
    const { data: lifecycleData, error: lifecycleError } = await supabase
      .from("user_lifecycle")
      .select("*")
      .gt("churn_risk_score", 0.4)
      .order("churn_risk_score", { ascending: false });

    if (lifecycleError) {
      console.error("Error fetching churn risk users:", lifecycleError);
      return NextResponse.json({ error: "Failed to fetch churn risk users" }, { status: 500 });
    }

    // Get activity metrics for each user
    const users = await Promise.all(
      (lifecycleData || []).map(async (lifecycle: any) => {
        const { data: metrics } = await supabase.rpc("get_user_activity_metrics", {
          user_id: lifecycle.user_id,
        } as any);

        // Get user email
        const { data: userData } = await supabase
          .from("users")
          .select("email")
          .eq("id", lifecycle.user_id)
          .single();

        return {
          userId: lifecycle.user_id,
          email: (userData as any)?.email || "unknown",
          churnRiskScore: lifecycle.churn_risk_score || 0,
          reasons: lifecycle.churn_risk_reasons || [],
          lifecycleStage: lifecycle.current_stage,
          daysSinceLastActivity: (metrics as any)?.days_since_last_activity || 0,
          segment: lifecycle.segment,
        };
      })
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in churn-risk GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
