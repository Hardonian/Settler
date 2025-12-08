import { NextResponse } from "next/server";

export function POST() {
  try {
    // Clear impersonation cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete("impersonate_user_id");
    return response;
  } catch (error) {
    console.error("Error in impersonate/stop POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
