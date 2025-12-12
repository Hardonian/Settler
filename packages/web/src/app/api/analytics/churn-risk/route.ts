import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

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

    type LifecycleRow = { 
      user_id: string;
      churn_risk_score?: number;
      churn_risk_reasons?: unknown;
      current_stage?: string;
      segment?: string;
    };
    // Get activity metrics for each user
    const users = await Promise.all(
      (lifecycleData || []).map(async (lifecycle: LifecycleRow) => {
        const rpcCall = supabase.rpc as unknown as (name: string, args: { user_id: string }) => Promise<{ data: unknown; error: unknown }>;
        const rpcResult = await rpcCall("get_user_activity_metrics", {
          user_id: lifecycle.user_id,
        });
        const metrics = rpcResult.data;

        // Get user email
        const { data: userData } = await supabase
          .from("users")
          .select("email")
          .eq("id", lifecycle.user_id)
          .single();

        type UserDataRow = { email?: string } | null;
        type MetricsRow = { days_since_last_activity?: number } | null;
        
        return {
          userId: lifecycle.user_id,
          email: (userData as UserDataRow)?.email || "unknown",
          churnRiskScore: lifecycle.churn_risk_score || 0,
          reasons: (lifecycle.churn_risk_reasons as unknown[]) || [],
          lifecycleStage: lifecycle.current_stage || "unknown",
          daysSinceLastActivity: (metrics as MetricsRow)?.days_since_last_activity || 0,
          segment: lifecycle.segment || "unknown",
        };
      })
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in churn-risk GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
