import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
