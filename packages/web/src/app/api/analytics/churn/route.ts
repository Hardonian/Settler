import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";

    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get churned users
    const { data: churned } = await supabase
      .from("user_lifecycle")
      .select("user_id, churn_risk_reasons")
      .eq("current_stage", "churned")
      .gte("updated_at", startDate.toISOString());

    // Get total users
    const { data: totalUsers } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", startDate.toISOString());

    // Get revenue lost
    const { data: cancelledSubs } = await supabase
      .from("subscriptions")
      .select("amount")
      .eq("status", "cancelled")
      .gte("cancelled_at", startDate.toISOString());

    const churnedCount = churned?.length || 0;
    const totalCount = totalUsers?.length || 0;
    const churnRate = totalCount > 0 ? (churnedCount / totalCount) * 100 : 0;
    const mrrLost = (cancelledSubs || []).reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

    // Aggregate churn reasons
    const reasonsMap = new Map<string, number>();
    for (const user of churned || []) {
      const reasons = (user as any).churn_risk_reasons || [];
      for (const reason of reasons) {
        reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
      }
    }

    const churnReasons = Array.from(reasonsMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average lifetime (mock for now)
    const avgLifetime = 6.5; // months

    const metrics = {
      churnRate,
      churnedUsers: churnedCount,
      revenueChurn: mrrLost > 0 ? (mrrLost / (mrrLost + 10000)) * 100 : 0, // Mock calculation
      mrrLost,
      avgLifetime,
      churnReasons,
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Error in churn GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
