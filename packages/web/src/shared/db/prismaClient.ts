/**
 * Prisma Client Singleton - Optimized
 *
 * Provides a shared Prisma client instance for the Next.js app.
 */

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

const { PrismaClient, Prisma } = require("@prisma/client") as {
  PrismaClient: typeof import("@prisma/client").PrismaClient;
  Prisma: any;
};

const PrismaExport = Prisma;
export { PrismaExport as Prisma };

type PrismaQueryRaw = {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  $queryRaw<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientType;
};

const isBuildPhase = prismaGlobals.__PRISMA_BUILD_PHASE__ ?? false;
const nodeEnv = typeof process !== "undefined" && process.env ? process.env["NODE_ENV"] : "production";

let prismaInstance: PrismaClientType;

try {
  // If Prisma insists on accelerateUrl due to edge runtime detection
  const opts: any = {};
  if (isBuildPhase || process.env.NEXT_RUNTIME !== "nodejs") {
      opts.accelerateUrl = "prisma://dummy";
  }
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient(opts);
} catch (error) {
  console.error("[Prisma] Failed to initialize Prisma client:", error);
  prismaInstance = new Proxy({} as PrismaClientType, {
    get(_target, prop) {
      const propName = String(prop);
      if (propName.startsWith("$")) {
        return async () => [];
      }
      return async () => null;
    },
  }) as PrismaClientType;
  (prismaInstance as PrismaClientWithError).__prismaInitError = error;
}

let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000;

async function checkConnectionHealth(): Promise<boolean> {
  try {
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

if (typeof setInterval !== "undefined" && nodeEnv === "production" && !isBuildPhase) {
  const healthCheckTimer = setInterval(async () => {
    const now = Date.now();
    if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = now;
      await checkConnectionHealth().catch(() => {});
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
