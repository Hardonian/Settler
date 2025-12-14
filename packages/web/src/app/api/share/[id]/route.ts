/**
 * Shareable Artifacts API Route
 * Generates shareable links for reports, dashboards, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

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
    const { artifactType, artifactId, public: isPublic } = body;

    if (!artifactType || !artifactId) {
      return NextResponse.json(
        { error: "artifactType and artifactId are required" },
        { status: 400 }
      );
    }

    // Generate shareable ID
    const shareId = nanoid(12);

    // Store shareable link
    await supabase.from("shareable_artifacts").insert({
      id: shareId,
      user_id: user.id,
      artifact_type: artifactType,
      artifact_id: artifactId,
      public: isPublic || false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
    const shareUrl = `${baseUrl}/share/${shareId}`;

    return NextResponse.json({
      shareId,
      shareUrl,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Share artifact error:", error);
    return NextResponse.json(
      { error: "Failed to create shareable link" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get shareable artifact
    const { data: artifact, error } = await supabase
      .from("shareable_artifacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !artifact) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if expired
    if (new Date(artifact.expires_at) < new Date()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    // Check if public or user owns it
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!artifact.public && (!user || user.id !== artifact.user_id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get artifact data based on type
    let artifactData = null;

    if (artifact.artifact_type === "reconciliation_report") {
      const { data } = await supabase
        .from("reconciliation_jobs")
        .select("*")
        .eq("id", artifact.artifact_id)
        .single();
      artifactData = data;
    } else if (artifact.artifact_type === "receipt") {
      const { data } = await supabase
        .from("receipts")
        .select("*")
        .eq("id", artifact.artifact_id)
        .single();
      artifactData = data;
    }

    return NextResponse.json({
      artifact: artifactData,
      metadata: {
        type: artifact.artifact_type,
        createdAt: artifact.created_at,
        expiresAt: artifact.expires_at,
      },
    });
  } catch (error) {
    console.error("Get shareable artifact error:", error);
    return NextResponse.json(
      { error: "Failed to get artifact" },
      { status: 500 }
    );
  }
}
