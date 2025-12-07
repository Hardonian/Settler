import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { category, action, label, value, properties, userId, sessionId } = body;

    // Store event in analytics_events table
    const { error } = await supabase.from("analytics_events").insert({
      user_id: userId || user?.id,
      session_id: sessionId,
      event_category: category,
      event_action: action,
      event_label: label,
      event_value: value,
      event_properties: properties || {},
      created_at: new Date().toISOString(),
    } as any);

    if (error) {
      console.error("Error storing event:", error);
      return NextResponse.json({ error: "Failed to store event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in events POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
