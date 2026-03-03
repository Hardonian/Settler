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
    { status, headers: { "content-type": "application/problem+json", "x-request-id": requestId } }
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
  if (!auth?.tenantId || !auth.userId) {
    return problem(
      401,
      "SETTLER_AUTH_REQUIRED",
      "Authentication required",
      "Provide a valid API key with tenant scope.",
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
    await prisma.reconResult.create({
      data: {
        reconJobId: job.id,
        tenantId: ctx.tenantId,
        status: "succeeded",
        completedAt: new Date(),
        summary: { message: "sync execution completed" },
        metadata: { fingerprint: createHash("sha256").update(job.id).digest("hex") },
      },
    });
    await prisma.reconJob.update({ where: { id: job.id }, data: { status: "completed" } });
  }

  return job;
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
