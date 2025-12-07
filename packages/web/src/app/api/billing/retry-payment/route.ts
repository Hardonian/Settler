import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { userId, subscriptionId } = body;
    const targetUserId = userId || user.id;

    // Get subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("id", subscriptionId)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // In production, retry payment with Stripe
    // const paymentIntent = await stripe.paymentIntents.create({...});

    // Update payment recovery
    const { data: recovery } = await supabase
      .from("payment_recovery")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("subscription_id", subscriptionId)
      .eq("status", "active")
      .single();

    if (recovery) {
      await supabase
        .from("payment_recovery")
        .update({
          recovery_attempts: recovery.recovery_attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recovery.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in retry-payment POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
