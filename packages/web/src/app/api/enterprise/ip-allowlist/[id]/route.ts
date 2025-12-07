import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // In production, delete from ip_allowlists table
    // await supabase.from("ip_allowlists").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in ip-allowlist DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
