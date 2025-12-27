import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const POST = withUniversalBillingGate(async function POST(_request: NextRequest, { params }, { feature: 'POST API' });: { params: { snapshotId: string } }) {
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
        return NextResponse.json(
      {
        success: false,
        error: 'Failed to rollback',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
      }
    } else if (project_type === "integration") {
      const { error: updateError } = await supabase
        .from("integration_credentials")
        .update(snapshot_data as any as never)
        .eq("id", project_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error rolling back integration:", updateError);
        return NextResponse.json(
      {
        success: false,
        error: 'Failed to rollback',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in rollback:", error);
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
