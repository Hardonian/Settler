import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../../config";
import { Pool } from "../../db";

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

  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl
      ? { rejectUnauthorized: config.nodeEnv === "production" || config.nodeEnv === "preview" }
      : false,
    min: config.database.poolMin,
    max: config.database.poolMax,
    connectionTimeoutMillis: config.database.connectionTimeout,
    statement_timeout: config.database.statementTimeout,
  });
  const adapter = new PrismaPg(pool);

  return { log: logLevel, adapter } as ConstructorParameters<typeof PrismaClient>[0];
}

export const prisma = globalForPrisma.prisma || new PrismaClient(buildPrismaOptions());

export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

if (config.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
