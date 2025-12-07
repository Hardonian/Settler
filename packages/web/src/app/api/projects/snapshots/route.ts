import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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
      console.error("Error fetching snapshots:", error);
      return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
    }

    return NextResponse.json({
      snapshots: (data || []).map((s) => ({
        id: s.id,
        projectId: s.project_id,
        projectType: s.project_type,
        snapshotName: s.snapshot_name,
        createdAt: s.created_at,
        createdBy: s.created_by,
      })),
    });
  } catch (error) {
    console.error("Error in snapshots GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      const { data } = await supabase
        .from("reconciliation_jobs")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();
      projectData = data || {};
    } else if (projectType === "integration") {
      const { data } = await supabase
        .from("integration_credentials")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();
      projectData = data || {};
    }

    // Create snapshot
    const { data: snapshot, error } = await supabase
      .from("project_snapshots")
      .insert({
        user_id: user.id,
        project_id: projectId,
        project_type: projectType,
        snapshot_name: snapshotName,
        snapshot_data: projectData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating snapshot:", error);
      return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("Error in snapshots POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
