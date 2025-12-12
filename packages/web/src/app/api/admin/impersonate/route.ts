import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In production, verify user is admin
    // const { data: userRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
    // if (userRole?.role !== "admin") {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    // }

    const body = await request.json();
    const { userId } = body;

    // Set impersonation session
    // In production, use secure session management
    const response = NextResponse.json({ success: true });
    response.cookies.set("impersonate_user_id", userId, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Error in impersonate POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
