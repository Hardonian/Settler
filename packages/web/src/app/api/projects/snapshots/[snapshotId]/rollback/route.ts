import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: { snapshotId: string } }) {
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

    const { project_id, project_type, snapshot_data } = snapshot;

    // Restore project data based on type
    if (project_type === "job") {
      const { error: updateError } = await supabase
        .from("reconciliation_jobs" as any)
        .update(snapshot_data as any as never)
        .eq("id", project_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error rolling back job:", updateError);
        return NextResponse.json({ error: "Failed to rollback" }, { status: 500 });
      }
    } else if (project_type === "integration") {
      const { error: updateError } = await supabase
        .from("integration_credentials")
        .update(snapshot_data as any as never)
        .eq("id", project_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error rolling back integration:", updateError);
        return NextResponse.json({ error: "Failed to rollback" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in rollback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
