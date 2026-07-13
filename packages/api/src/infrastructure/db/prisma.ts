import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../../config";
import { Pool, pool } from "../../db";

// Global variable to prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Prisma Client Singleton
 *
 * Ensures only one instance of Prisma Client is created.
 * Prisma 7 "client" engine requires a driver adapter or accelerateUrl.
 * We use @prisma/adapter-pg for direct PostgreSQL connections.
 */
function buildPrismaOptions(): ConstructorParameters<typeof PrismaClient>[0] {
  const logLevel = config.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"];

  // Reuse the globally configured pool from db/index.ts
  const adapter = new PrismaPg(pool);

  return { log: logLevel, adapter } as ConstructorParameters<typeof PrismaClient>[0];
}

export const prisma = globalForPrisma.prisma || new PrismaClient(buildPrismaOptions());

export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('request.jwt.claim.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

if (config.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
