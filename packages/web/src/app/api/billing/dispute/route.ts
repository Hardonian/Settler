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
    const { invoiceId, amount, reason, description } = body;

    // Create dispute record
    const { data, error } = await supabase
      .from("billing_disputes")
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        disputed_amount: parseFloat(amount),
        reason,
        description,
        status: "pending",
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating dispute:", error);
      return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
    }

    // In production, notify billing team

    return NextResponse.json({ dispute: data });
  } catch (error) {
    console.error("Error in dispute POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
