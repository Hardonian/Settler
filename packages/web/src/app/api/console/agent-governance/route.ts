import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { getTenantContext } from "@/lib/tenant/server";
import {
  resolveTenantForMutation,
  resolveTenantMembershipScope,
} from "@/lib/supabase/tenant-membership";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE_URL =
  process.env.SETTLER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const DRAFT_ID_PATTERN = /^draft_[A-Za-z0-9_-]{1,128}$/;
const AGENT_IDS = new Set([
  "infrastructure-optimizer",
  "anomaly-detector",
  "synthetic-user-simulator",
  "support-copilot",
  "release-qa-agent",
]);

async function resolveAuthenticatedTenantId(): Promise<string> {
  const [scope, tenantContext] = await Promise.all([
    resolveTenantMembershipScope(),
    getTenantContext(),
  ]);
  return resolveTenantForMutation(scope.tenantIds, tenantContext.tenantId || null);
}

function upstreamHeaders(request: NextRequest, tenantId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-tenant-id": tenantId,
    Authorization: request.headers.get("authorization") || "",
  };
}

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const tenantId = await resolveAuthenticatedTenantId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const agentId = searchParams.get("agentId");
    if (status && !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid draft status" }, { status: 400 });
    }
    if (agentId && !AGENT_IDS.has(agentId)) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }

    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (agentId) query.set("agentId", agentId);

    const response = await fetch(`${API_BASE_URL}/api/v2/ai-agents/drafts?${query.toString()}`, {
      headers: upstreamHeaders(request, tenantId),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({ error: "Invalid upstream response" }));
    return NextResponse.json(body, { status: response.status });
  },
  { requireAuth: true }
);

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    const tenantId = await resolveAuthenticatedTenantId();
    const body = (await request.json()) as {
      action?: unknown;
      draftId?: unknown;
      reason?: unknown;
    };
    if (body.action !== "approve" && body.action !== "reject") {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }
    if (typeof body.draftId !== "string" || !DRAFT_ID_PATTERN.test(body.draftId)) {
      return NextResponse.json({ error: "Invalid draftId" }, { status: 400 });
    }
    if (body.reason !== undefined && typeof body.reason !== "string") {
      return NextResponse.json({ error: "reason must be a string" }, { status: 400 });
    }

    const endpoint = `${API_BASE_URL}/api/v2/ai-agents/drafts/${body.draftId}/${body.action}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: upstreamHeaders(request, tenantId),
      body: JSON.stringify({ reason: body.reason?.slice(0, 2_000) }),
      cache: "no-store",
    });
    const responseBody = await response
      .json()
      .catch(() => ({ error: "Invalid upstream response" }));
    return NextResponse.json(responseBody, { status: response.status });
  },
  { requireAuth: true }
);
