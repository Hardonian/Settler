/**
 * Vercel SDK Integration Examples
 *
 * This route demonstrates how to use the integrated Vercel SDKs:
 * - @vercel/kv for caching
 * - @vercel/edge-config for configuration
 * - @vercel/blob for file storage
 *
 * Note: This is an example route. Remove or secure it in production.
 */

import { NextRequest, NextResponse } from "next/server";
import { kv, cacheGet, cacheSet } from "@/lib/vercel/kv";
import { edgeConfig, getFeatureFlagFromEdgeConfig } from "@/lib/vercel/edge-config";
import { blob } from "@/lib/vercel/blob";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = "force-dynamic";

/**
 * GET - Example usage of all Vercel SDKs
 */
export const GET = withUniversalBillingGate(async function GET(request: NextRequest) {
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
}, { feature: 'GET API' });

/**
 * POST - Example file upload using Blob storage
 */
export const POST = withUniversalBillingGate(async function POST(request: NextRequest) {
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
}, { feature: 'POST API' });

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
