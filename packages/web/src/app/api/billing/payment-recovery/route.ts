import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const userId = searchParams.get("userId") || user.id;
    const subscriptionId = searchParams.get("subscriptionId");

    let query = supabase
      .from("payment_recovery")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    if (subscriptionId) {
      query = query.eq("subscription_id", subscriptionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching payment recovery:", error);
      return NextResponse.json({ error: "Failed to fetch recovery status" }, { status: 500 });
    }

    // Check if grace period has expired
    if (data && data.length > 0) {
      const recovery = data[0];
      if (recovery.grace_period_ends_at && new Date(recovery.grace_period_ends_at) < new Date()) {
        // Grace period expired, update status
        await supabase
          .from("payment_recovery")
          .update({ status: "failed" })
          .eq("id", recovery.id);
        return NextResponse.json({ recovery: null });
      }
    }

    return NextResponse.json({ recovery: data?.[0] || null });
  } catch (error) {
    console.error("Error in payment-recovery GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, subscriptionId, failureType } = body;
    const targetUserId = userId || user.id;

    // Check for existing active recovery
    const { data: existing } = await supabase
      .from("payment_recovery")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("status", "active")
      .single();

    if (existing) {
      // Increment failure count
      const gracePeriodEnds = new Date();
      gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 7); // 7-day grace period

      const { data, error } = await supabase
        .from("payment_recovery")
        .update({
          failure_count: existing.failure_count + 1,
          failure_type: failureType,
          grace_period_ends_at: gracePeriodEnds.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating payment recovery:", error);
        return NextResponse.json({ error: "Failed to update recovery" }, { status: 500 });
      }

      return NextResponse.json({ recovery: data });
    }

    // Create new recovery record
    const gracePeriodEnds = new Date();
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 7); // 7-day grace period

    const { data, error } = await supabase
      .from("payment_recovery")
      .insert({
        user_id: targetUserId,
        subscription_id: subscriptionId,
        failure_type: failureType,
        failure_count: 1,
        grace_period_ends_at: gracePeriodEnds.toISOString(),
        status: "grace_period",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment recovery:", error);
      return NextResponse.json({ error: "Failed to create recovery" }, { status: 500 });
    }

    return NextResponse.json({ recovery: data });
  } catch (error) {
    console.error("Error in payment-recovery POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
