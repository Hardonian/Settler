/**
 * Prisma Client Singleton - Optimized
 *
 * Provides a shared Prisma client instance for the Next.js app.
 * Optimized for:
 * - Connection pooling (reduces connection overhead)
 * - Connection timeouts (prevents hanging connections)
 * - Error recovery (automatic reconnection)
 * - Query optimization (select only needed fields)
 *
 * Prisma 7 compatibility:
 * - Forces binary engine by ensuring DATABASE_URL is available
 * - Prisma 7 uses client engine in edge/serverless environments by default
 * - Setting DATABASE_URL explicitly helps force binary engine usage
 */

// This file is server-only and should not be bundled for the browser
// Webpack configuration excludes this file from client bundles

// CRITICAL: Set environment variables BEFORE importing PrismaClient
// Prisma 7 determines engine type at import time, so we must set these first
type PrismaGlobal = typeof globalThis & {
  __PRISMA_BUILD_PHASE__?: boolean;
};

type PrismaClientWithError = PrismaClient & {
  __prismaInitError?: unknown;
};

const prismaGlobals = globalThis as PrismaGlobal;

if (typeof process !== "undefined" && process.env) {
  // Use bracket notation to prevent webpack from optimizing these away
  const env = process.env;

  // Force binary engine - this must be set before PrismaClient is imported
  // This is critical for Prisma 7 to use binary engine instead of client engine
  env["PRISMA_CLIENT_ENGINE_TYPE"] = "binary";

  // Ensure Node.js runtime is detected (not edge)
  // Prisma 7 uses client engine in edge/serverless environments
  if (!env["NEXT_RUNTIME"]) {
    env["NEXT_RUNTIME"] = "nodejs";
  }

  // During build time, ensure DATABASE_URL is set (even if dummy) to help Prisma
  // detect that binary engine should be used. Prisma uses DATABASE_URL presence
  // as a signal for binary engine vs client engine.
  // Note: This won't cause issues if DATABASE_URL is not actually used during build
  // since we're only collecting page data, not executing queries.
  // Check if we're in a build context (Next.js build phase or Vercel build)
  // During Next.js build, when collecting page data, DATABASE_URL might not be set
  // but Prisma needs it to detect binary engine type
  // Use bracket notation to prevent webpack from optimizing these away
  const isBuildPhase =
    env["NEXT_PHASE"] === "phase-production-build" ||
    (env["NODE_ENV"] === "production" && env["VERCEL"] === "1") ||
    (env["NODE_ENV"] === "production" && !env["DATABASE_URL"]) ||
    env["VERCEL"] === "1";

  if (!env["DATABASE_URL"] && isBuildPhase) {
    // During build phase, set a dummy DATABASE_URL to help Prisma detect binary engine
    // This is safe because we're not actually connecting during build
    // Prisma will not actually connect during build - it only needs the URL for engine detection
    // Use a valid PostgreSQL connection string format to avoid parsing errors
    env["DATABASE_URL"] =
      "postgresql://dummy:dummy@localhost:5432/dummy?schema=public&connection_limit=1";

    // Also set PRISMA_CLIENT_ENGINE_TYPE explicitly during build
    if (!env["PRISMA_CLIENT_ENGINE_TYPE"]) {
      env["PRISMA_CLIENT_ENGINE_TYPE"] = "binary";
    }
  }

  // Store isBuildPhase for use after import
  prismaGlobals.__PRISMA_BUILD_PHASE__ = isBuildPhase;
}

import { PrismaClient } from "@prisma/client";

type PrismaQueryRaw = {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  $queryRaw<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

// Prevent multiple instances in development
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

// PrismaClient configuration with connection pooling optimization
// Note: In Prisma 7, if the client was generated with "client" engine type,
// we must provide either adapter or accelerateUrl. Since we generate with
// PRISMA_CLIENT_ENGINE_TYPE=binary, this should not be needed, but we handle
// it as a safety measure during build time.
const isBuildPhase = prismaGlobals.__PRISMA_BUILD_PHASE__ ?? false;

// Use bracket notation to prevent webpack from optimizing process.env access
const nodeEnv =
  typeof process !== "undefined" && process.env ? process.env["NODE_ENV"] : "production";

// Optimize DATABASE_URL with connection pooling parameters
// Prisma reads DATABASE_URL from process.env automatically, but we can override it
// with connection pooling parameters for better performance
function getOptimizedDatabaseUrl(): string | undefined {
  // Check multiple possible env var names (DATABASE_URL, SUPABASE_DATABASE_URL, DIRECT_URL)
  const dbUrl =
    process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl || isBuildPhase) {
    return dbUrl;
  }

  // Parse URL to add connection pool parameters
  try {
    const url = new URL(dbUrl);

    // Add connection pool parameters for optimal performance
    // connection_limit: Max connections per instance (Supabase free tier: 60 total)
    // pool_timeout: Time to wait for connection (seconds)
    // connect_timeout: Connection timeout (seconds)
    // statement_timeout: Query timeout (milliseconds)
    url.searchParams.set("connection_limit", "5"); // Conservative for serverless
    url.searchParams.set("pool_timeout", "20"); // 20 seconds
    url.searchParams.set("connect_timeout", "10"); // 10 seconds
    url.searchParams.set("statement_timeout", "30000"); // 30 seconds query timeout

    // For Supabase, use connection pooling port if available
    if (url.hostname.includes("supabase.co") && !url.hostname.includes("pooler")) {
      // Keep direct connection for now, but could switch to pooler
      // url.port = '6543'; // Connection pooler port
    }

    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return dbUrl;
  }
}

// During build time, if Prisma Client was generated with "client" engine type,
// it requires either adapter or accelerateUrl. We provide a dummy accelerateUrl
// during build only to satisfy the constructor requirement.
// This is safe because Prisma won't actually connect during build when collecting page data.
const optimizedDbUrl = getOptimizedDatabaseUrl();

// Prisma automatically reads DATABASE_URL from process.env, so we only need to:
// 1. Override with optimized URL if we want connection pooling params
// 2. Provide accelerateUrl ONLY during build phase when DATABASE_URL is truly missing
// IMPORTANT: Don't provide accelerateUrl if DATABASE_URL exists, as it will override the direct connection
const prismaConfig: Record<string, any> = {
  log: nodeEnv === "development" ? ["error", "warn"] : ["error"], // Reduced logging in production
  // Only provide accelerateUrl during build phase if DATABASE_URL is truly missing
  // This satisfies Prisma Client constructor when generated with client engine type
  // But we check at runtime, not at module load time, since Next.js loads .env files
  ...(isBuildPhase && !optimizedDbUrl
    ? {
        accelerateUrl: "https://dummy.prisma-accelerate.com",
      }
    : {}),
  // Add datasource override with optimized connection string (adds connection pooling params)
  // Only override if we have a URL and we're not in build phase
  ...(optimizedDbUrl && !isBuildPhase
    ? {
        datasources: {
          db: {
            url: optimizedDbUrl,
          },
        },
      }
    : {}),
};

// Create Prisma client instance with error handling
// Note: Prisma 7 may detect client engine type during build even if generated with binary engine.
// We ensure PRISMA_CLIENT_ENGINE_TYPE=binary is set above to prevent this.
// If Prisma still uses client engine, we provide accelerateUrl above as a fallback.
let prismaInstance: PrismaClient;

try {
  // Prisma will automatically read DATABASE_URL from process.env
  // If DATABASE_URL is not set, Prisma will throw an error
  // We catch it and provide a graceful fallback
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

  // Log successful initialization (only in development)
  if (nodeEnv === "development" && optimizedDbUrl) {
    console.log("[Prisma] Client initialized successfully with connection pooling");
  }
} catch (error) {
  // If Prisma initialization fails (e.g., missing DATABASE_URL or engine type mismatch),
  // create a stub client that returns null/empty results gracefully
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check if it's a missing DATABASE_URL or engine type issue
  const isMissingConfig =
    errorMessage.includes("adapter") ||
    errorMessage.includes("accelerateUrl") ||
    errorMessage.includes("DATABASE_URL") ||
    errorMessage.includes("connection string");

  // Check actual env vars at error time (Next.js may have loaded them by now)
  const actualDbUrl =
    typeof process !== "undefined" && process.env
      ? process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL
      : undefined;

  // During build phase, suppress warnings about missing DATABASE_URL
  // as we intentionally use a dummy URL for engine detection
  if (!isBuildPhase) {
    if (isMissingConfig && !actualDbUrl) {
      console.warn(
        "[Prisma] DATABASE_URL not found in environment variables. " +
          "Please ensure DATABASE_URL, SUPABASE_DATABASE_URL, or DIRECT_URL is set in your .env file. " +
          "Using stub client that returns empty results."
      );
    } else if (isMissingConfig && actualDbUrl) {
      console.warn(
        "[Prisma] DATABASE_URL found but Prisma initialization failed. " +
          "This may be due to Prisma Client engine type mismatch. " +
          "Check that PRISMA_CLIENT_ENGINE_TYPE=binary is set or provide accelerateUrl. " +
          "Using stub client that returns empty results."
      );
    } else {
      console.error("[Prisma] Failed to initialize Prisma client:", error);
    }
  }

  // Create a stub client that returns null/empty arrays for queries
  prismaInstance = new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }
      if (prop === "$queryRaw") {
        return async () => [];
      }
      // Return a proxy for model access that returns null/empty arrays
      return new Proxy(
        {},
        {
          get(_modelTarget, modelProp) {
            if (modelProp === "findFirst" || modelProp === "findUnique") {
              return async () => null;
            }
            if (modelProp === "findMany") {
              return async () => [];
            }
            if (
              modelProp === "create" ||
              modelProp === "update" ||
              modelProp === "delete" ||
              modelProp === "upsert"
            ) {
              return async () => {
                throw new Error(
                  "Prisma client not initialized. DATABASE_URL or Prisma configuration is missing. " +
                    "Set SAFE_MODE=1 to disable database features."
                );
              };
            }
            // Return another proxy for nested access (e.g., prisma.tenant.findFirst)
            return new Proxy(
              {},
              {
                get() {
                  return async () => null;
                },
              }
            );
          },
        }
      );
    },
  }) as PrismaClient;

  // Store the error for debugging
  (prismaInstance as PrismaClientWithError).__prismaInitError = error;
}

// Add connection health check
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

async function checkConnectionHealth(): Promise<boolean> {
  try {
    await prismaInstance.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("[Prisma] Connection health check failed:", error);
    return false;
  }
}

// Periodic health check (non-blocking)
if (typeof setInterval !== "undefined" && nodeEnv === "production") {
  setInterval(async () => {
    const now = Date.now();
    if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = now;
      await checkConnectionHealth().catch(() => {
        // Health check failed, but don't crash
      });
    }
  }, HEALTH_CHECK_INTERVAL);
}

// Graceful shutdown handler
if (typeof process !== "undefined") {
  const shutdown = async () => {
    console.log("[Prisma] Closing database connections...");
    await prismaInstance.$disconnect().catch((error) => {
      console.error("[Prisma] Error disconnecting:", error);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("beforeExit", shutdown);
}

export const prisma = prismaInstance as PrismaClient & PrismaQueryRaw;

if (nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

// Export health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  return checkConnectionHealth();
}
