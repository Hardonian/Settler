import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "../../config";

// Global variable to prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Prisma Client Singleton
 *
 * Ensures only one instance of Prisma Client is created.
 * Prisma 7 "client" engine requires a driver adapter or accelerateUrl.
 * We use @prisma/adapter-pg for direct PostgreSQL connections.
 */
function buildPrismaOptions(): any {
  const logLevel = config.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"];

  if (config.nodeEnv === "test") {
    return {
      log: logLevel,
      accelerateUrl: "prisma://localhost/?api_key=test",
    };
  }

  const pool = new pg.Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    min: config.database.poolMin,
    max: config.database.poolMax,
    connectionTimeoutMillis: config.database.connectionTimeout,
    statement_timeout: config.database.statementTimeout,
  });
  const adapter = new PrismaPg(pool);

  return { log: logLevel, adapter };
}

export const prisma = globalForPrisma.prisma || new PrismaClient(buildPrismaOptions());

if (config.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
