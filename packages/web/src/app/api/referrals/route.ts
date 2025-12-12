import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReferralCode, applyReferralCode, getReferralStats } from "@/lib/referrals";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export async function GET(_request: NextRequest) {
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
    console.error("Error in referrals GET:", error);
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
    console.error("Error in referrals POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
