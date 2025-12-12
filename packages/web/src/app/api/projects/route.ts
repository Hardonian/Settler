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

    // Mock projects (in production, fetch from projects table)
    const projects = [
      {
        id: "proj-1",
        name: "E-commerce Reconciliation",
        description: "Main reconciliation project for online store",
        memberCount: 5,
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "proj-2",
        name: "Payment Processing",
        description: "Payment reconciliation across platforms",
        memberCount: 3,
        createdAt: "2026-01-10T00:00:00Z",
      },
    ];

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error in projects GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
