import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/shared/auth/apiKey";
import { prisma } from "@/shared/db/prismaClient";
import { encrypt } from "@/lib/security/encryption";
import { getRedisClient } from "@/lib/redis/client";
import { z } from "zod";

export const runtime = "nodejs";

// ─── TTLs ─────────────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_SEC = 60;
const IDEMPOTENCY_TTL_SEC = 60 * 60 * 24; // 24 h
const DATASET_TTL_SEC = 60 * 60 * 24 * 7; // 7 d

type ProblemCode =
  | "SETTLER_AUTH_REQUIRED"
  | "SETTLER_RATE_LIMITED"
  | "SETTLER_TENANT_REQUIRED"
  | "SETTLER_INVALID_INPUT"
  | "SETTLER_CONFLICT"
  | "SETTLER_NOT_FOUND"
  | "SETTLER_NOT_IMPLEMENTED"
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

// ─── In-memory fallbacks (single-instance only) ───────────────────────────────
const _routeBuckets = new Map<string, { count: number; resetAt: number }>();
const _idempotencyStore = new Map<string, { hash: string; response: Record<string, unknown> }>();
const _datasetStore = new Map<
  string,
  Array<{ id: string; name: string; source: string; createdAt: string }>
>();

export type ApiContext = { requestId: string; tenantId: string; userId: string; ip: string };

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

// ─── Rate limiting (Redis-backed, in-memory fallback) ─────────────────────────
export async function applyRateLimit(
  ctx: ApiContext,
  routeClass: "read" | "write"
): Promise<NextResponse | null> {
  const envKey = `SETTLER_RATE_LIMIT_${routeClass.toUpperCase()}`;
  const limit = Number(process.env[envKey] || (routeClass === "write" ? 30 : 120));
  const redisKey = `rl:v1:${ctx.tenantId}:${ctx.ip}:${routeClass}`;

  const redis = await getRedisClient();

  if (redis) {
    try {
      const count: number = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, RATE_LIMIT_WINDOW_SEC);
      }
      if (count > limit) {
        const ttl: number = Math.max(await redis.ttl(redisKey), 1);
        const res = problem(
          429,
          "SETTLER_RATE_LIMITED",
          "Rate limited",
          "Too many requests for this tenant and IP.",
          ctx.requestId,
          "rate-limit"
        );
        res.headers.set("retry-after", String(ttl));
        return res;
      }
      return null;
    } catch {
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback (single-instance; not suitable for multi-replica deployments without Redis)
  const now = Date.now();
  const key = `${ctx.tenantId}:${ctx.ip}:${routeClass}`;
  const current = _routeBuckets.get(key);
  if (!current || current.resetAt < now) {
    _routeBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_SEC * 1000 });
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
  _routeBuckets.set(key, current);
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

// ─── Idempotency (Redis-backed, in-memory fallback) ───────────────────────────
export async function getIdempotent(tenantId: string, key: string, body: unknown) {
  const reqHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const redisKey = `idem:v1:${tenantId}:${key}`;

  const redis = await getRedisClient();

  if (redis) {
    try {
      const stored = (await redis.get(redisKey)) as {
        hash: string;
        response: Record<string, unknown>;
      } | null;
      if (!stored) return { reqHash, replay: null };
      if (stored.hash !== reqHash) return { reqHash, conflict: true };
      return { reqHash, replay: stored.response };
    } catch {
      // Fall through to in-memory fallback
    }
  }

  const lookup = _idempotencyStore.get(`${tenantId}:${key}`);
  if (!lookup) return { reqHash, replay: null };
  if (lookup.hash !== reqHash) return { reqHash, conflict: true };
  return { reqHash, replay: lookup.response };
}

export async function storeIdempotent(
  tenantId: string,
  key: string,
  reqHash: string,
  response: Record<string, unknown>
) {
  const redisKey = `idem:v1:${tenantId}:${key}`;
  const redis = await getRedisClient();

  if (redis) {
    try {
      await redis.set(redisKey, { hash: reqHash, response }, { ex: IDEMPOTENCY_TTL_SEC });
      return;
    } catch {
      // Fall through to in-memory fallback
    }
  }

  _idempotencyStore.set(`${tenantId}:${key}`, { hash: reqHash, response });
}

// ─── Dataset store (Redis-backed, in-memory fallback) ─────────────────────────
type DatasetEntry = { id: string; name: string; source: string; createdAt: string };

export async function listDatasets(tenantId: string): Promise<DatasetEntry[]> {
  const redisKey = `datasets:v1:${tenantId}`;
  const redis = await getRedisClient();

  if (redis) {
    try {
      const stored = (await redis.get(redisKey)) as DatasetEntry[] | null;
      return stored ?? [];
    } catch {
      // Fall through to in-memory fallback
    }
  }

  return _datasetStore.get(tenantId) ?? [];
}

export async function addDataset(
  tenantId: string,
  payload: { name: string; source: string }
): Promise<DatasetEntry> {
  const entry: DatasetEntry = {
    id: randomUUID(),
    name: payload.name,
    source: payload.source,
    createdAt: new Date().toISOString(),
  };

  const redisKey = `datasets:v1:${tenantId}`;
  const redis = await getRedisClient();

  if (redis) {
    try {
      const current = ((await redis.get(redisKey)) as DatasetEntry[] | null) ?? [];
      current.unshift(entry);
      await redis.set(redisKey, current, { ex: DATASET_TTL_SEC });
      return entry;
    } catch {
      // Fall through to in-memory fallback
    }
  }

  const current = _datasetStore.get(tenantId) ?? [];
  current.unshift(entry);
  _datasetStore.set(tenantId, current);
  return entry;
}

export async function createRun(ctx: ApiContext, body: z.infer<typeof RunCreateSchema>) {
  if (!body.async) {
    // Synchronous execution is not yet implemented. Callers must use async: true
    // and poll /runs/:id for status. Returning 501 prevents a fake "succeeded"
    // result from being written without any actual reconciliation work.
    throw Object.assign(
      new Error(
        "Synchronous run mode is not yet supported. Set async: true and poll for completion."
      ),
      { code: "SETTLER_NOT_IMPLEMENTED", status: 501 }
    );
  }

  const sourceConfigEncrypted = encrypt(JSON.stringify(body.sourceConfig));
  const targetConfigEncrypted = encrypt(JSON.stringify(body.targetConfig));

  const job = await prisma.reconJob.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      name: body.name,
      description: body.description || null,
      sourceAdapter: body.sourceAdapter,
      sourceConfigEncrypted,
      targetAdapter: body.targetAdapter,
      targetConfigEncrypted,
      validationRules: body.rules,
      status: "queued",
      metadata: { mode: "async" },
    },
  });

  return job;
}

export async function recordRequestMetrics(ctx: ApiContext, payload: RequestMetricsPayload) {
  try {
    await prisma.$executeRaw`
      INSERT INTO request_metrics (tenant_id, route, method, status_code, latency_ms, cache_hit, rate_limited)
      VALUES (${ctx.tenantId}, ${payload.route}, ${payload.method}, ${payload.statusCode}, ${payload.latencyMs}, ${payload.cacheHit}, ${payload.rateLimited})
    `;
  } catch (error) {
    console.error("[metrics] recording failed:", error);
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
    console.error("[metrics] recording failed:", error);
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
    console.error("[metrics] recording failed:", error);
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
    console.error("[metrics] recording failed:", error);
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
  // Typed errors with an explicit status (e.g. 501 Not Implemented)
  if (
    error instanceof Error &&
    typeof (error as NodeJS.ErrnoException & { status?: number }).status === "number"
  ) {
    const typedError = error as Error & { code?: ProblemCode; status: number };
    const knownCodes: ProblemCode[] = [
      "SETTLER_AUTH_REQUIRED",
      "SETTLER_RATE_LIMITED",
      "SETTLER_TENANT_REQUIRED",
      "SETTLER_INVALID_INPUT",
      "SETTLER_CONFLICT",
      "SETTLER_NOT_FOUND",
      "SETTLER_NOT_IMPLEMENTED",
      "SETTLER_INTERNAL",
    ];
    const code: ProblemCode =
      typedError.code && knownCodes.includes(typedError.code as ProblemCode)
        ? (typedError.code as ProblemCode)
        : "SETTLER_INTERNAL";
    return problem(
      typedError.status,
      code,
      "Request failed",
      typedError.message,
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
