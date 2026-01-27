import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(_request: NextRequest, { params }: { params: { snapshotId: string } }) {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("reconciliation_jobs" as any)
        .update(snapshot_data as Record<string, unknown> as never)
        .eq("id", project_id)
        .eq("user_id", user.id);

      if (updateError) {
        appLogger.error("Error rolling back job", updateError);
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
        .update(snapshot_data as Record<string, unknown> as never)
        .eq("id", project_id)
        .eq("user_id", user.id);

      if (updateError) {
        appLogger.error("Error rolling back integration", updateError);
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
  } catch {
    appLogger.error("Error in rollback", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: true }
);