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

    // Mock allowlist (in production, fetch from ip_allowlists table)
    const allowlist = [
      {
        id: "ip-1",
        ipAddress: "192.168.1.0/24",
        description: "Office Network",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "ip-2",
        ipAddress: "10.0.0.1",
        description: "VPN Gateway",
        createdAt: "2026-01-05T00:00:00Z",
      },
    ];

    return NextResponse.json({ allowlist });
  } catch (error) {
    console.error("Error in ip-allowlist GET:", error);
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
    const { ipAddress: _ipAddress } = body;

    // In production, insert into ip_allowlists table
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in ip-allowlist POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
