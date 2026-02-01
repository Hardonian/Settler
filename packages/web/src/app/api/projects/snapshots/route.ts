import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const GET = withUniversalBillingGate(async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const projectType = searchParams.get("projectType");

    if (!projectId || !projectType) {
      return NextResponse.json({ error: "Missing projectId or projectType" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("project_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .eq("project_type", projectType)
      .order("created_at", { ascending: false });

    if (error) {
      appLogger.error("Error fetching snapshots", error);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch snapshots',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    type SnapshotRow = {
      id: string;
      project_id: string;
      project_type: string;
      snapshot_name: string;
      created_at: string;
      created_by: string;
    };
    
    return NextResponse.json({
      snapshots: (data || []).map((s: SnapshotRow) => ({
        id: s.id,
        projectId: s.project_id,
        projectType: s.project_type,
        snapshotName: s.snapshot_name,
        createdAt: s.created_at,
        createdBy: s.created_by,
      })),
    });
  } catch (_error) {
    appLogger.error("Error in snapshots GET", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' });

export const POST = withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, projectType, snapshotName } = body;

    if (!projectId || !projectType) {
      return NextResponse.json({ error: "Missing projectId or projectType" }, { status: 400 });
    }

    // Fetch current project data based on type
    let projectData: Record<string, unknown> = {};

    if (projectType === "job") {
      const jobResult = await ((supabase
        .from("reconciliation_jobs") as any)
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single() as Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>);
      projectData = jobResult.data || {};
    } else if (projectType === "integration") {
      const integrationResult = await ((supabase
        .from("integration_credentials") as any)
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single() as Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>);
      projectData = integrationResult.data || {};
    }

    // Create snapshot
    const snapshotResult = await ((supabase
      .from("project_snapshots") as any)
      .insert({
        user_id: user.id,
        project_id: projectId,
        project_type: projectType,
        snapshot_name: snapshotName || "Untitled Snapshot",
        snapshot_data: projectData,
        created_by: user.id,
      } as Record<string, unknown>)
      .select()
      .single() as Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>);
    const { data: snapshot, error } = snapshotResult;

    if (error) {
      appLogger.error("Error creating snapshot", error);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to create snapshot',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    return NextResponse.json({ snapshot });
  } catch (_error) {
    appLogger.error("Error in snapshots POST", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' });
