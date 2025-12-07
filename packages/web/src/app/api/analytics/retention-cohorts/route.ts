import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user cohorts (grouped by signup month)
    const { data: users } = await supabase
      .from("users")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!users) {
      return NextResponse.json({ cohorts: [] });
    }

    // Group by cohort (month)
    const cohortsMap = new Map<string, string[]>();
    for (const user of users || []) {
      const cohort = new Date((user as any).created_at).toISOString().substring(0, 7); // YYYY-MM
      if (!cohortsMap.has(cohort)) {
        cohortsMap.set(cohort, []);
      }
      cohortsMap.get(cohort)!.push((user as any).id);
    }

    // Calculate retention for each cohort
    const cohorts = await Promise.all(
      Array.from(cohortsMap.entries()).map(async ([cohort, userIds]) => {
        const cohortDate = new Date(cohort + "-01");

        // Calculate retention at different time points
        const week1 = new Date(cohortDate);
        week1.setDate(week1.getDate() + 7);
        const week2 = new Date(cohortDate);
        week2.setDate(week2.getDate() + 14);
        const week4 = new Date(cohortDate);
        week4.setDate(week4.getDate() + 28);
        const week8 = new Date(cohortDate);
        week8.setDate(week8.getDate() + 56);
        const week12 = new Date(cohortDate);
        week12.setDate(week12.getDate() + 84);

        // Get active users at each time point
        const getActiveCount = async (date: Date) => {
          const { data } = await supabase
            .from("user_lifecycle")
            .select("user_id")
            .in("user_id", userIds)
            .gte("last_active_at", date.toISOString());
          return (data as any)?.length || 0;
        };

        const [w1, w2, w4, w8, w12] = await Promise.all([
          getActiveCount(week1),
          getActiveCount(week2),
          getActiveCount(week4),
          getActiveCount(week8),
          getActiveCount(week12),
        ]);

        return {
          cohort,
          users: userIds.length,
          retention: {
            week1: userIds.length > 0 ? (w1 / userIds.length) * 100 : 0,
            week2: userIds.length > 0 ? (w2 / userIds.length) * 100 : 0,
            week4: userIds.length > 0 ? (w4 / userIds.length) * 100 : 0,
            week8: userIds.length > 0 ? (w8 / userIds.length) * 100 : 0,
            week12: userIds.length > 0 ? (w12 / userIds.length) * 100 : 0,
          },
        };
      })
    );

    return NextResponse.json({ cohorts });
  } catch (error) {
    console.error("Error in retention-cohorts GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
