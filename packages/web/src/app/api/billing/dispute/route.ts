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
    const { invoiceId, amount, reason, description } = body;

    // Create dispute record
    const { data, error } = await ((supabase
      .from("billing_disputes") as any)
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        disputed_amount: parseFloat(amount),
        reason,
        description,
        status: "pending",
      })
      .select()
      .single() as Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>);

    if (error) {
      appLogger.error("Error creating dispute", error);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to create dispute',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    // In production, notify billing team

    return NextResponse.json({ dispute: data });
  } catch {
    appLogger.error("Error in dispute POST", error);
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
