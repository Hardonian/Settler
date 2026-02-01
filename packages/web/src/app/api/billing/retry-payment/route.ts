import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRequestBody } from "@/types/api";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

interface RetryPaymentRequestBody extends Record<string, unknown> {
  userId?: string;
  subscriptionId: string;
}

interface PaymentRecoveryRow {
  id: string;
  recovery_attempts?: number;
  updated_at?: string;
  [key: string]: unknown;
}

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseRequestBody<RetryPaymentRequestBody>(request);
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
      const recoveryData = recovery as PaymentRecoveryRow;
       
      await (supabase.from("payment_recovery") as any)
        .update({
          recovery_attempts: (recoveryData.recovery_attempts || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recoveryData.id);
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    appLogger.error("Error in retry-payment POST", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: true }
);
