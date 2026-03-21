import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReferralCode, applyReferralCode, getReferralStats } from "@/lib/referrals";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getReferralStats(user.id);
    return NextResponse.json({ stats });
  } catch (error) {
    appLogger.error("Error in referrals GET", error);
    return NextResponse.json({ error: "Failed to fetch referral stats" }, { status: 500 });
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
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
    const { action, referralCode } = body;

    if (action === "generate") {
      const code = await generateReferralCode(user.id);
      return NextResponse.json({ referralCode: code });
    }

    if (action === "apply" && referralCode) {
      const result = await applyReferralCode(user.id, referralCode);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    appLogger.error("Error in referrals POST", error);
    return NextResponse.json({ error: "Failed to process referral action" }, { status: 500 });
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
