import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRequestBody } from "@/types/api";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

interface AnalyticsEventRequestBody extends Record<string, unknown> {
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await parseRequestBody<AnalyticsEventRequestBody>(request);
    const { category, action, label, value, properties, userId, sessionId } = body;

    // Store event in analytics_events table
    const { error } = await (supabase.from("analytics_events") as any).insert({
      user_id: userId || user?.id,
      session_id: sessionId,
      event_category: category,
      event_action: action,
      event_label: label,
      event_value: value,
      event_properties: properties || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing event:", error);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to store event',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in events POST:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}
