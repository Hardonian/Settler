import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

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
    const { milestoneType, metadata } = body;

    // Check if milestone already exists
    const { data: existing } = await supabase
      .from("user_milestones")
      .select("id")
      .eq("user_id", user.id)
      .eq("milestone_type", milestoneType)
      .single();

    if (existing) {
      return NextResponse.json({ achieved: true, message: "Milestone already achieved" });
    }

    // Create milestone
    const { data, error } = await supabase
      .from("user_milestones")
      .insert({
        user_id: user.id,
        milestone_type: milestoneType,
        milestone_data: metadata || {},
      } as any)
      .select()
      .single();

    if (error) {
      appLogger.error("Error creating milestone", error);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to create milestone',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    // Update user lifecycle if this is an activation milestone
    if (milestoneType === "first_successful_run") {
      await supabase.from("user_lifecycle").upsert({
        user_id: user.id,
        first_successful_setup_at: new Date().toISOString(),
        current_stage: "activation",
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>);
    }

    return NextResponse.json({ achieved: true, milestone: data });
  } catch (error) {
    appLogger.error("Error in milestones POST", error);
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
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

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
    const milestoneType = searchParams.get("type");

    let query = supabase.from("user_milestones").select("milestone_type").eq("user_id", user.id);

    if (milestoneType) {
      query = query.eq("milestone_type", milestoneType);
    }

    const { data, error } = await query;

    if (error) {
      appLogger.error("Error fetching milestones", error);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch milestones',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    if (milestoneType) {
      return NextResponse.json({ achieved: (data?.length || 0) > 0 });
    }

    type MilestoneRow = { milestone_type: string };
    const milestones = (data || []).map((m: MilestoneRow) => m.milestone_type);
    return NextResponse.json({ milestones });
  } catch (error) {
    appLogger.error("Error in milestones GET", error);
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
