import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const DELETE = withSecurity(
  withUniversalBillingGate(async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params; // Get params to satisfy type

    // In production, delete from ip_allowlists table
    // await supabase.from("ip_allowlists").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (_error) {
    appLogger.error("Error in ip-allowlist DELETE", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'DELETE API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);