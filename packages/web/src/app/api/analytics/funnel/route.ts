import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";

    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get funnel data
    const { data: signups } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", startDate.toISOString());

    const { data: activated } = await supabase
      .from("user_lifecycle")
      .select("user_id")
      .not("activated_at", "is", null)
      .gte("activated_at", startDate.toISOString());

    const { data: paid } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active")
      .gte("created_at", startDate.toISOString());

    const signupCount = signups?.length || 0;
    const activatedCount = activated?.length || 0;
    const paidCount = paid?.length || 0;

    const funnel = [
      {
        name: "Signups",
        count: signupCount,
        percentage: 100,
        dropoff: 0,
      },
      {
        name: "Activated",
        count: activatedCount,
        percentage: signupCount > 0 ? (activatedCount / signupCount) * 100 : 0,
        dropoff: signupCount > 0 ? ((signupCount - activatedCount) / signupCount) * 100 : 0,
      },
      {
        name: "Paid",
        count: paidCount,
        percentage: signupCount > 0 ? (paidCount / signupCount) * 100 : 0,
        dropoff: activatedCount > 0 ? ((activatedCount - paidCount) / activatedCount) * 100 : 0,
      },
    ];

    return NextResponse.json({ funnel });
  } catch (error) {
    console.error("Error in funnel GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
