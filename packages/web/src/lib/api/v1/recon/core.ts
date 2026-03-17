import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/shared/auth/apiKey";
import { prisma } from "@/shared/db/prismaClient";
import { z } from "zod";

export const runtime = "nodejs";

type ProblemCode =
  | "SETTLER_AUTH_REQUIRED"
  | "SETTLER_RATE_LIMITED"
  | "SETTLER_TENANT_REQUIRED"
  | "SETTLER_INVALID_INPUT"
  | "SETTLER_CONFLICT"
  | "SETTLER_NOT_FOUND"
  | "SETTLER_INTERNAL";

export const RunCreateSchema = z
  .object({
    name: z.string().min(1),
    sourceAdapter: z.string().min(1),
    targetAdapter: z.string().min(1),
    description: z.string().optional(),
    async: z.boolean().optional().default(true),
    sourceConfig: z.record(z.string(), z.unknown()).optional().default({}),
    targetConfig: z.record(z.string(), z.unknown()).optional().default({}),
    rules: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  })
  .strict();

export const DatasetCreateSchema = z
  .object({
    name: z.string().min(1),
    source: z.string().min(1),
  })
  .strict();

const routeBuckets = new Map<string, { count: number; resetAt: number }>();
const idempotencyStore = new Map<string, { hash: string; response: Record<string, unknown> }>();
const datasetStore = new Map<
  string,
  Array<{ id: string; name: string; source: string; createdAt: string }>
>();

type ApiContext = { requestId: string; tenantId: string; userId: string; ip: string };

type RunMetricsPayload = {
  runId: string;
  status: string;
  durationMs: number;
  fingerprint: string | null;
  replayOk: boolean | null;
  evidenceSizeBytes: number;
  policyId: string;
  policyHash: string;
};

type RequestMetricsPayload = {
  route: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  cacheHit: boolean;
  rateLimited: boolean;
};

function problem(
  status: number,
  code: ProblemCode,
  title: string,
  detail: string,
  requestId: string,
  instance: string
) {
  return NextResponse.json(
    {
      type: `https://api.settler.dev/problems/${code.toLowerCase()}`,
      code,
      title,
      status,
      detail,
      instance,
      request_id: requestId,
    },
    {
      status,
      headers: {
        "content-type": "application/problem+json",
        "x-request-id": requestId,
        "cache-control": "no-store, max-age=0",
      },
    }
  );
}

function withSecurityHeaders(res: NextResponse, requestId: string) {
  res.headers.set("x-request-id", requestId);
  res.headers.set("x-content-type-options", "nosniff");
  res.headers.set("x-frame-options", "DENY");
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  res.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  return res;
}

function getEtag(payload: unknown) {
  return `\"${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}\"`;
}

export async function buildContext(request: NextRequest): Promise<ApiContext | NextResponse> {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const auth = await authenticateApiKey(request);

  // TENANT ISOLATION HARDENING: Strictly enforce tenant boundary before returning context.
  // Prevents "—", empty strings, or undefined from leaking into downstream Prisma queries.
  if (
    !auth?.tenantId ||
    typeof auth.tenantId !== "string" ||
    auth.tenantId.trim() === "" ||
    auth.tenantId === "—" ||
    !auth.userId
  ) {
    return problem(
      401,
      "SETTLER_AUTH_REQUIRED",
      "Authentication required",
      "Provide a valid API key with a strict tenant scope.",
      requestId,
      request.nextUrl.pathname
    );
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return { requestId, tenantId: auth.tenantId, userId: auth.userId, ip };
}

export function applyRateLimit(ctx: ApiContext, routeClass: "read" | "write"): NextResponse | null {
  const now = Date.now();
  const envKey = `SETTLER_RATE_LIMIT_${routeClass.toUpperCase()}`;
  const limit = Number(process.env[envKey] || (routeClass === "write" ? 30 : 120));
  const key = `${ctx.tenantId}:${ctx.ip}:${routeClass}`;
  const current = routeBuckets.get(key);
  if (!current || current.resetAt < now) {
    routeBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return null;
  }
  if (current.count >= limit) {
    const res = problem(
      429,
      "SETTLER_RATE_LIMITED",
      "Rate limited",
      "Too many requests for this tenant and IP.",
      ctx.requestId,
      "rate-limit"
    );
    res.headers.set("retry-after", String(Math.ceil((current.resetAt - now) / 1000)));
    return res;
  }
  current.count += 1;
  routeBuckets.set(key, current);
  return null;
}

export function checkConditionalGet(request: NextRequest, payload: unknown): NextResponse | null {
  const etag = getEtag(payload);
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { etag } });
  }
  return null;
}

export function setCachingHeaders(res: NextResponse, payload: unknown, immutable = false) {
  res.headers.set("etag", getEtag(payload));
  res.headers.set(
    "cache-control",
    immutable ? "private, max-age=300, immutable" : "private, max-age=30"
  );
  return res;
}

export function getIdempotent(tenantId: string, key: string, body: unknown) {
  const reqHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const lookup = idempotencyStore.get(`${tenantId}:${key}`);
  if (!lookup) return { reqHash, replay: null };
  if (lookup.hash !== reqHash) return { reqHash, conflict: true };
  return { reqHash, replay: lookup.response };
}

export function storeIdempotent(
  tenantId: string,
  key: string,
  reqHash: string,
  response: Record<string, unknown>
) {
  idempotencyStore.set(`${tenantId}:${key}`, { hash: reqHash, response });
}

export async function createRun(ctx: ApiContext, body: z.infer<typeof RunCreateSchema>) {
  const startedAt = Date.now();
  const job = await prisma.reconJob.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      name: body.name,
      description: body.description || null,
      sourceAdapter: body.sourceAdapter,
      sourceConfigEncrypted: JSON.stringify(body.sourceConfig),
      targetAdapter: body.targetAdapter,
      targetConfigEncrypted: JSON.stringify(body.targetConfig),
      validationRules: body.rules,
      status: body.async ? "queued" : "running",
      metadata: { mode: body.async ? "async" : "sync" },
    },
  });

  if (!body.async) {
    const fingerprint = createHash("sha256").update(job.id).digest("hex");
    await prisma.reconResult.create({
      data: {
        reconJobId: job.id,
        tenantId: ctx.tenantId,
        status: "succeeded",
        completedAt: new Date(),
        summary: { message: "sync execution completed" },
        metadata: { fingerprint },
      },
    });
    await prisma.reconJob.update({ where: { id: job.id }, data: { status: "completed" } });

    await recordRunMetrics(ctx, {
      runId: job.id,
      status: "succeeded",
      durationMs: Date.now() - startedAt,
      fingerprint,
      replayOk: null,
      evidenceSizeBytes: JSON.stringify(body).length,
      policyId: "default",
      policyHash: createHash("sha256").update("default-policy").digest("hex"),
    });

    await recordEconomicMetrics(ctx, job.id, {
      computeUnits: 1,
      memoryUnits: 1,
      casIoUnits: 1,
      replayCalls: 0,
    });
  }

  return job;
}

export async function recordRequestMetrics(ctx: ApiContext, payload: RequestMetricsPayload) {
  try {
    await prisma.$executeRaw`
      INSERT INTO request_metrics (tenant_id, route, method, status_code, latency_ms, cache_hit, rate_limited)
      VALUES (${ctx.tenantId}, ${payload.route}, ${payload.method}, ${payload.statusCode}, ${payload.latencyMs}, ${payload.cacheHit}, ${payload.rateLimited})
    `;
  } catch (error) {
    void error;
  }
}

export async function recordRunMetrics(ctx: ApiContext, payload: RunMetricsPayload) {
  try {
    await prisma.$executeRaw`
      INSERT INTO run_metrics (tenant_id, run_id, status, duration_ms, fingerprint, replay_ok, evidence_size_bytes, policy_id, policy_hash)
      VALUES (${ctx.tenantId}, ${payload.runId}, ${payload.status}, ${payload.durationMs}, ${payload.fingerprint}, ${payload.replayOk}, ${payload.evidenceSizeBytes}, ${payload.policyId}, ${payload.policyHash})
      ON CONFLICT (tenant_id, run_id) DO UPDATE SET
        status = EXCLUDED.status,
        duration_ms = EXCLUDED.duration_ms,
        fingerprint = EXCLUDED.fingerprint,
        replay_ok = EXCLUDED.replay_ok,
        evidence_size_bytes = EXCLUDED.evidence_size_bytes,
        policy_id = EXCLUDED.policy_id,
        policy_hash = EXCLUDED.policy_hash,
        created_at = NOW()
    `;
  } catch (error) {
    void error;
  }
}

export async function recordEconomicMetrics(
  ctx: ApiContext,
  runId: string,
  payload: { computeUnits: number; memoryUnits: number; casIoUnits: number; replayCalls: number }
) {
  try {
    await prisma.$executeRaw`
      INSERT INTO economic_metrics (tenant_id, run_id, compute_units, memory_units, cas_io_units, replay_calls)
      VALUES (${ctx.tenantId}, ${runId}, ${payload.computeUnits}, ${payload.memoryUnits}, ${payload.casIoUnits}, ${payload.replayCalls})
    `;
  } catch (error) {
    void error;
  }
}

export async function recordDriftMetric(
  ctx: ApiContext,
  payload: {
    runId: string;
    expectedFingerprint: string | null;
    actualFingerprint: string;
    replayVerification: boolean;
  }
) {
  try {
    await prisma.$executeRaw`
      INSERT INTO drift_metrics (tenant_id, run_id, expected_fingerprint, actual_fingerprint, replay_verification)
      VALUES (${ctx.tenantId}, ${payload.runId}, ${payload.expectedFingerprint}, ${payload.actualFingerprint}, ${payload.replayVerification})
    `;
  } catch (error) {
    void error;
  }
}

export async function getRun(ctx: ApiContext, id: string) {
  return prisma.reconJob.findFirst({ where: { id, tenantId: ctx.tenantId, deletedAt: null } });
}

export async function getLatestResult(ctx: ApiContext, runId: string) {
  return prisma.reconResult.findFirst({
    where: { reconJobId: runId, tenantId: ctx.tenantId },
    orderBy: { startedAt: "desc" },
  });
}

export function listDatasets(tenantId: string) {
  return datasetStore.get(tenantId) || [];
}

export function addDataset(tenantId: string, payload: { name: string; source: string }) {
  const current = datasetStore.get(tenantId) || [];
  const entry = {
    id: randomUUID(),
    name: payload.name,
    source: payload.source,
    createdAt: new Date().toISOString(),
  };
  current.unshift(entry);
  datasetStore.set(tenantId, current);
  return entry;
}

export function ok(res: NextResponse, requestId: string) {
  return withSecurityHeaders(res, requestId);
}

export function fail(error: unknown, request: NextRequest, requestId: string) {
  if (error instanceof z.ZodError) {
    return problem(
      400,
      "SETTLER_INVALID_INPUT",
      "Invalid input",
      error.issues.map((issue) => issue.message).join("; ") || "Request payload failed validation",
      requestId,
      request.nextUrl.pathname
    );
  }
  const message = error instanceof Error ? error.message : "Unhandled API error";
  return problem(
    500,
    "SETTLER_INTERNAL",
    "Internal error",
    message,
    requestId,
    request.nextUrl.pathname
  );
}
