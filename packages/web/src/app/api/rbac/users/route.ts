import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock user roles (in production, fetch from user_roles table)
    const users = [
      {
        userId: "user-1",
        email: "admin@settler.dev",
        role: "admin",
        assignedAt: "2026-01-01T00:00:00Z",
      },
      {
        userId: "user-2",
        email: "dev@settler.dev",
        role: "developer",
        assignedAt: "2026-01-05T00:00:00Z",
      },
    ];

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in users GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
