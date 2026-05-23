/**
 * Vercel SDK Integration Examples
 *
 * This route demonstrates how to use the integrated Vercel SDKs:
 * - Upstash Redis/Vercel Redis integration for caching
 * - @vercel/edge-config for configuration
 * - @vercel/blob for file storage
 *
 * NOTE: This is an internal example route.
 * - Disabled in production
 * - Restricted to super admins in preview/development
 */

import { NextRequest, NextResponse } from "next/server";
import { kv, cacheGet, cacheSet } from "@/lib/vercel/kv";
import { edgeConfig, getFeatureFlagFromEdgeConfig } from "@/lib/vercel/edge-config";
import { blob } from "@/lib/vercel/blob";
import { withSecurity } from "@/lib/middleware/api-security";
import { requireAuth } from "@/lib/api/unified-auth";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

function isProductionRuntime(): boolean {
  // Vercel sets VERCEL_ENV to "production" for production deployments.
  // In preview deployments, VERCEL_ENV is "preview".
  return process.env.VERCEL_ENV === "production";
}

async function guardInternalAccess(request: NextRequest): Promise<NextResponse | null> {
  // Hard-disable in production to eliminate accidental exposure.
  if (isProductionRuntime()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Require authenticated session (Console users).
    await requireAuth(request);
  } catch {
    // Do not reveal route existence.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = await isSuperAdmin();
  if (!admin) {
    // Do not reveal route existence.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return null;
}

/**
 * GET - Example usage of all Vercel SDKs
 */
export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const denied = await guardInternalAccess(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "all";

    try {
      switch (action) {
        case "kv":
          return await handleKvExample();
        case "edge-config":
          return await handleEdgeConfigExample();
        case "blob":
          return await handleBlobExample();
        case "all":
        default:
          return await handleAllExamples();
      }
    } catch (error) {
      // Never return 500 - return graceful error response
      return NextResponse.json(
        {
          success: false,
          error: "Failed to execute example",
          message: error instanceof Error ? error.message : "Unknown error",
          examples: null,
        },
        { status: 200 }
      );
    }
  },
  { rateLimit: { windowMs: 60000, maxRequests: 60 }, requireAuth: true }
);

/**
 * POST - Example file upload using Blob storage
 */
export const POST = withSecurity(
  async function POST(request: NextRequest) {
    const denied = await guardInternalAccess(request);
    if (denied) return denied;

    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const result = await blob.put(`uploads/${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
      });

      return NextResponse.json({
        success: true,
        url: result.url,
        pathname: result.pathname,
        size: result.size ?? 0,
        contentType: result.contentType,
      });
    } catch (error) {
      // Never return 500 - return graceful error response
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload file",
          message: error instanceof Error ? error.message : "Unknown error",
          url: null,
        },
        { status: 200 }
      );
    }
  },
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: true }
);

async function handleKvExample() {
  // Example 1: Simple key-value storage
  await kv.set("example:key", { message: "Hello from KV", timestamp: Date.now() });
  const value = await kv.get("example:key");

  // Example 2: Caching with TTL
  const cacheKey = "example:cache";
  let cached = await cacheGet(cacheKey);
  if (!cached.cached) {
    // Simulate expensive operation
    const data = { computed: Date.now(), expensive: true };
    await cacheSet(cacheKey, data, 60);
    cached = { value: data, cached: false };
  }

  // Example 3: Counter
  const count = await kv.incr("example:counter");

  return NextResponse.json({
    service: "KV",
    examples: {
      simpleGetSet: value,
      caching: cached,
      counter: count,
    },
  });
}

async function handleEdgeConfigExample() {
  // Example 1: Get feature flag
  const featureFlag = await getFeatureFlagFromEdgeConfig("new_dashboard");

  // Example 2: Get any config value
  const apiEndpoint = await edgeConfig.get("api_endpoint");

  // Example 3: Check if key exists
  const hasKey = await edgeConfig.has("feature_enabled");

  return NextResponse.json({
    service: "Edge Config",
    examples: {
      featureFlag,
      apiEndpoint,
      hasKey,
      configured: edgeConfig.has !== undefined,
    },
  });
}

async function handleBlobExample() {
  // Example 1: List files
  const { blobs, hasMore } = await blob.list({ limit: 5 });

  // Example 2: Check if configured
  const configured = process.env.BLOB_READ_WRITE_TOKEN !== undefined;

  return NextResponse.json({
    service: "Blob",
    examples: {
      configured,
      fileCount: blobs.length,
      hasMore,
      sampleFiles: blobs.slice(0, 3).map((b) => ({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
      })),
    },
  });
}

async function handleAllExamples() {
  const [kvExample, edgeConfigExample, blobExample] = await Promise.all([
    handleKvExample().then((r) => r.json()),
    handleEdgeConfigExample().then((r) => r.json()),
    handleBlobExample().then((r) => r.json()),
  ]);

  return NextResponse.json({
    message: "All Vercel SDK examples",
    services: {
      kv: kvExample,
      edgeConfig: edgeConfigExample,
      blob: blobExample,
    },
    analytics: "Already integrated in layout.tsx",
    speedInsights: "Already integrated in layout.tsx",
  });
}
