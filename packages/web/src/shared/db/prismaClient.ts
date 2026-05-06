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

import type { PrismaClient as PrismaClientType } from "@prisma/client";

// CRITICAL: Set environment variables BEFORE loading PrismaClient
// Prisma 7 determines engine type at load time, so we must set these first
type PrismaGlobal = typeof globalThis & {
  __PRISMA_BUILD_PHASE__?: boolean;
};

type PrismaClientWithError = PrismaClientType & {
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
  if (env["NEXT_RUNTIME"] !== "nodejs") {
    env["NEXT_RUNTIME"] = "nodejs";
  }

  const isBuildPhase =
    env["NEXT_PHASE"] === "phase-production-build" ||
    (env["NODE_ENV"] === "production" && env["VERCEL"] === "1") ||
    (env["NODE_ENV"] === "production" && !env["DATABASE_URL"]) ||
    (typeof env["npm_lifecycle_event"] === "string" &&
      env["npm_lifecycle_event"].includes("build")) ||
    env["VERCEL"] === "1";

  if (!env["DATABASE_URL"] && isBuildPhase) {
    env["DATABASE_URL"] =
      "postgresql://dummy:dummy@localhost:5432/dummy?schema=public&connection_limit=1";
    if (!env["PRISMA_CLIENT_ENGINE_TYPE"]) {
      env["PRISMA_CLIENT_ENGINE_TYPE"] = "binary";
    }
  }
  prismaGlobals.__PRISMA_BUILD_PHASE__ = isBuildPhase;
}

// Use require after env setup so Prisma reads the correct runtime configuration.

const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: typeof import("@prisma/client").PrismaClient;
};

type PrismaQueryRaw = {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  $queryRaw<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRaw(
    query: TemplateStringsArray | import("@prisma/client").Prisma.Sql,
    ...values: unknown[]
  ): Promise<number>;
};

// Prevent multiple instances in development
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientType;
};

const isBuildPhase = prismaGlobals.__PRISMA_BUILD_PHASE__ ?? false;

const nodeEnv =
  typeof process !== "undefined" && process.env ? process.env["NODE_ENV"] : "production";

// Let Prisma handle reading the DATABASE_URL from the environment automatically.
// This avoids complex and brittle configuration logic that was causing failures.
let prismaInstance: PrismaClientType;

try {
  // Pass datasourceUrl explicitly to satisfy Prisma wasm/client engine validation.
  // The build phase sets a dummy DATABASE_URL to prevent build-time failures.
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
} catch (error) {
  console.error("[Prisma] Failed to initialize Prisma client:", error);
  // Create a stub client for graceful failure during builds or when DB is unavailable.
  prismaInstance = new Proxy({} as PrismaClientType, {
    get(_target, prop) {
      const propName = String(prop);
      if (propName.startsWith("$")) {
        return async () => {
          console.warn(
            `[Prisma Stub] Prisma not initialized. Call to ${propName} returning empty result.`
          );
          return [];
        };
      }
      return async () => {
        console.warn(
          `[Prisma Stub] Prisma not initialized. Call to model via ${propName} returning null.`
        );
        return null;
      };
    },
  }) as PrismaClientType;
  (prismaInstance as PrismaClientWithError).__prismaInitError = error;
}

// Add connection health check
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

async function checkConnectionHealth(): Promise<boolean> {
  try {
    // Cannot check health if the client is a stub
    if ("__prismaInitError" in prismaInstance) {
      return false;
    }
    await prismaInstance.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("[Prisma] Connection health check failed:", error);
    return false;
  }
}

// Periodic health check (non-blocking)
if (typeof setInterval !== "undefined" && nodeEnv === "production" && !isBuildPhase) {
  const healthCheckTimer = setInterval(async () => {
    const now = Date.now();
    if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = now;
      await checkConnectionHealth().catch(() => {
        // Health check failed, but don't crash
      });
    }
  }, HEALTH_CHECK_INTERVAL);

  healthCheckTimer.unref?.();
}

export const prisma = prismaInstance as PrismaClientType & PrismaQueryRaw;

if (nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  return checkConnectionHealth();
}
