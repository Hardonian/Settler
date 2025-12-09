import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }

    type TicketRow = {
      id: string;
      subject: string;
      status: string;
      severity: string;
      created_at: string;
      updated_at: string;
      assigned_to?: string | null;
    };
    
    return NextResponse.json({
      tickets: (data || []).map((t: TicketRow) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        severity: t.severity,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        assignedTo: t.assigned_to,
      })),
    });
  } catch (error) {
    console.error("Error in tickets GET:", error);
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
    const { subject, description, category, severity } = body;

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject,
        description,
        category,
        severity: severity || "medium",
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ticket:", error);
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    // Check for escalation rules
    // In production, trigger escalation logic here

    return NextResponse.json({ ticket: data });
  } catch (error) {
    console.error("Error in tickets POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
