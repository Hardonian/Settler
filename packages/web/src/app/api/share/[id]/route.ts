/**
 * Shareable Artifacts API Route
 * Generates shareable links for reports, dashboards, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
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
    const shareId = randomBytes(9).toString("base64url");

    // Store shareable link
    await ((supabase.from("shareable_artifacts") as any).insert({
      id: shareId,
      user_id: user.id,
      artifact_type: artifactType,
      artifact_id: artifactId,
      public: isPublic || false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    }) as Promise<{ error: { message?: string } | null }>);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
    const shareUrl = `${baseUrl}/share/${shareId}`;

    return NextResponse.json({
      shareId,
      shareUrl,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    appLogger.error("Share artifact error", error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create shareable link',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get shareable artifact
    const artifactResult = await ((supabase
      .from("shareable_artifacts") as any)
      .select("*")
      .eq("id", id)
      .single() as Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>);
    const { data: artifact, error } = artifactResult;

    if (error || !artifact) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const typedArtifact = artifact as {
      expires_at: string;
      public: boolean;
      user_id: string;
      artifact_type: string;
      artifact_id: string;
      created_at: string;
    };

    // Check if expired
    if (new Date(typedArtifact.expires_at) < new Date()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    // Check if public or user owns it
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!typedArtifact.public && (!user || user.id !== typedArtifact.user_id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const metadata = {
      type: typedArtifact.artifact_type,
      createdAt: typedArtifact.created_at,
      expiresAt: typedArtifact.expires_at,
    };

    if (typedArtifact.artifact_type === 'reconciliation_report') {
      const reportResult = await ((supabase
        .from('reconciliation_jobs') as any)
        .select('*')
        .eq('id', typedArtifact.artifact_id)
        .single() as Promise<{
          data: Record<string, unknown> | null;
          error: { message?: string } | null;
        }>);

      if (reportResult.error || !reportResult.data) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      return NextResponse.json({
        artifact: reportResult.data,
        metadata,
      });
    }

    if (typedArtifact.artifact_type === 'receipt') {
      const receiptResult = await ((supabase
        .from('receipts') as any)
        .select('*')
        .eq('id', typedArtifact.artifact_id)
        .single() as Promise<{
          data: Record<string, unknown> | null;
          error: { message?: string } | null;
        }>);

      if (receiptResult.error || !receiptResult.data) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      return NextResponse.json({
        artifact: receiptResult.data,
        metadata,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported artifact type' },
      { status: 400 }
    );
  } catch (error) {
    appLogger.error("Get shareable artifact error", error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get artifact',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
