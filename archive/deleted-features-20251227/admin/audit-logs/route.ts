import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock audit logs (in production, fetch from audit_logs table)
    const logs = [
      {
        id: "log-1",
        userId: "user-123",
        action: "login",
        resource: "authentication",
        details: "User logged in successfully",
        ipAddress: "192.168.1.1",
        timestamp: new Date().toISOString(),
      },
      {
        id: "log-2",
        userId: "user-456",
        action: "update",
        resource: "subscription",
        details: "Subscription upgraded to Enterprise",
        ipAddress: "192.168.1.2",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error in audit-logs GET:", error);
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
