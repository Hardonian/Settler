import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { snapshotId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { snapshotId } = params;

    // Get snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from("project_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .eq("user_id", user.id)
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    // Return as JSON file
    const snapshotData = snapshot as any;
    const exportData = {
      snapshotId: snapshotData.id,
      projectId: snapshotData.project_id,
      projectType: snapshotData.project_type,
      snapshotName: snapshotData.snapshot_name,
      createdAt: snapshotData.created_at,
      data: snapshotData.snapshot_data,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="snapshot-${snapshotId}.json"`,
      },
    });
  } catch (error) {
    console.error("Error in export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
