/**
 * GET /api/console/workforce/run-deltas/:runDeltaId/analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";
import type { Prisma } from "@prisma/client";
import {
  buildEvidenceRefs,
  buildPriorRunDeltaBriefing,
  type PriorRunDeltaSource,
} from "@settler/reconciliation-core";
import crypto from "node:crypto";
import { gateConsoleTenant } from "../../../_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ runDeltaId: string }>;
}

const WORKER_KEY = "prior_run_delta_analyst";
const WORKER_VERSION = "1";

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string");
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseConfigDrift(raw: unknown): { length: number } {
  if (Array.isArray(raw)) return { length: raw.length };
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return { length: Array.isArray(p) ? p.length : 0 };
    } catch {
      return { length: 0 };
    }
  }
  return { length: 0 };
}

function hashBriefing(
  briefing: ReturnType<typeof buildPriorRunDeltaBriefing>,
  evidence: Array<{ kind: string; ref: string }>
): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        briefing,
        evidenceRefs: evidence.map((e) => e.ref).sort(),
      })
    )
    .digest("hex");
}

export const GET = withSecurity(
  async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
    const gate = await gateConsoleTenant(request);
    if (!gate.ok) return gate.response;

    const { runDeltaId } = await params;

    const deltaRow = await prisma.runDelta.findFirst({
      where: { id: runDeltaId, tenantId: gate.tenantId },
    });

    if (!deltaRow) {
      return NextResponse.json(
        { error: "RUN_DELTA_NOT_FOUND", message: "Run delta not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.workerRun.findFirst({
      where: { tenantId: gate.tenantId, runDeltaId, workerKey: WORKER_KEY },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json(
        {
          data: {
            id: existing.id,
            tenantId: existing.tenantId,
            workerKey: existing.workerKey,
            workerVersion: existing.workerVersion,
            trigger: existing.trigger,
            runDeltaId: existing.runDeltaId,
            status: existing.status,
            output: existing.output,
            evidence: existing.evidence,
            degradedReasons: existing.degradedReasons,
            createdAt: existing.createdAt.toISOString(),
            completedAt: existing.completedAt.toISOString(),
          },
          capability: { state: "available", source: "persisted" },
        },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const newPatterns = parseJsonArray(deltaRow.newExceptionPatterns);
    const resolvedPatterns = parseJsonArray(deltaRow.resolvedPatterns);
    const configDrift = parseConfigDrift(deltaRow.configDriftSummary);

    let inputChanged = false;
    const inputDelta = deltaRow.inputDelta;
    if (inputDelta && typeof inputDelta === "object" && !Array.isArray(inputDelta)) {
      const o = inputDelta as Record<string, unknown>;
      inputChanged = o["currentHash"] !== o["previousHash"];
    }

    const source: PriorRunDeltaSource = {
      id: deltaRow.id,
      currentRunId: deltaRow.currentRunId,
      previousRunId: deltaRow.previousRunId,
      jobId: deltaRow.jobId,
      exceptionDelta: deltaRow.exceptionDelta,
      matchedDelta: deltaRow.matchedDelta,
      unmatchedDelta: deltaRow.unmatchedDelta,
      inputChanged,
      configDriftDetected: deltaRow.configDriftDetected || configDrift.length > 0,
      severityDeltas: {
        critical: deltaRow.criticalDelta,
        high: deltaRow.highDelta,
        medium: deltaRow.mediumDelta,
        low: deltaRow.lowDelta,
      },
      newExceptionPatterns: newPatterns,
      resolvedPatterns,
    };

    const briefing = buildPriorRunDeltaBriefing(source);
    const evidence = buildEvidenceRefs(source);
    const contentHash = hashBriefing(briefing, evidence);
    const outputWithHash = { ...briefing, contentHash };

    const degradedReasons: string[] = [];
    if (!briefing.basis.priorRunPresent) degradedReasons.push("no_prior_run_on_delta");
    if (source.configDriftDetected) degradedReasons.push("config_drift_flagged");

    const row = await prisma.workerRun.create({
      data: {
        tenantId: gate.tenantId,
        workerKey: WORKER_KEY,
        workerVersion: WORKER_VERSION,
        trigger: "api_on_demand",
        runDeltaId,
        status: "succeeded",
        output: outputWithHash as Prisma.InputJsonValue,
        evidence: evidence as unknown as Prisma.InputJsonValue,
        degradedReasons: degradedReasons as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: row.id,
          tenantId: row.tenantId,
          workerKey: row.workerKey,
          workerVersion: row.workerVersion,
          trigger: row.trigger,
          runDeltaId: row.runDeltaId,
          status: row.status,
          output: row.output,
          evidence: row.evidence,
          degradedReasons: row.degradedReasons,
          createdAt: row.createdAt.toISOString(),
          completedAt: row.completedAt.toISOString(),
        },
        capability: { state: "available", source: "computed_on_demand" },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  },
  {
    rateLimit: { windowMs: 60_000, maxRequests: 60 },
    requireAuth: true,
  }
);
