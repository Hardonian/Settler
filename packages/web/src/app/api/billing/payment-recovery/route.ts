import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
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
      appLogger.error("Error fetching payment recovery", error);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recovery status',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    // Check if grace period has expired
    if (data && data.length > 0 && data[0]) {
      const recovery = data[0] as { id: string; grace_period_ends_at?: string };
      if (recovery?.grace_period_ends_at && new Date(recovery.grace_period_ends_at) < new Date()) {
        // Grace period expired, update status
        await supabase
          .from("payment_recovery")
          .update({ status: "failed" } as never)
          .eq("id", recovery.id);
        return NextResponse.json({ recovery: null });
      }
    }

    return NextResponse.json({ recovery: data?.[0] || null });
   
      } catch (error) {
    appLogger.error("Error in payment-recovery GET", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

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

      const existingData = existing as { id: string; failure_count?: number };
      const { data, error } = await supabase
        .from("payment_recovery")
        .update({
          failure_count: (existingData.failure_count || 0) + 1,
          failure_type: failureType,
          grace_period_ends_at: gracePeriodEnds.toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", existingData.id)
        .select()
        .single();

      if (error) {
        appLogger.error("Error updating payment recovery", error);
        return NextResponse.json(
      {
        success: false,
        error: 'Failed to update recovery',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
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
      } as never)
      .select()
      .single();

    if (error) {
      appLogger.error("Error creating payment recovery", error);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to create recovery',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    return NextResponse.json({ recovery: data });
   
      } catch (error) {
    appLogger.error("Error in payment-recovery POST", error);
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
