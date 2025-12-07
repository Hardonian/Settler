import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock roles (in production, fetch from roles table)
    const roles = [
      {
        id: "admin",
        name: "Admin",
        permissions: ["read", "write", "delete", "manage_users", "manage_billing"],
        userCount: 3,
      },
      {
        id: "developer",
        name: "Developer",
        permissions: ["read", "write"],
        userCount: 8,
      },
      {
        id: "support",
        name: "Support",
        permissions: ["read", "manage_tickets"],
        userCount: 5,
      },
      {
        id: "viewer",
        name: "Viewer",
        permissions: ["read"],
        userCount: 12,
      },
    ];

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error in roles GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
