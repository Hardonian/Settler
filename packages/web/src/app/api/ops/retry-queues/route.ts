import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock retry queue data (in production, fetch from queue system)
    const queues = [
      {
        queueName: "integration-sync",
        pending: 45,
        failed: 3,
        processing: 12,
      },
      {
        queueName: "webhook-delivery",
        pending: 23,
        failed: 1,
        processing: 8,
      },
      {
        queueName: "email-sends",
        pending: 156,
        failed: 5,
        processing: 34,
      },
      {
        queueName: "billing-computation",
        pending: 8,
        failed: 0,
        processing: 2,
      },
    ];

    return NextResponse.json({ queues });
  } catch (error) {
    console.error("Error in retry-queues GET:", error);
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
