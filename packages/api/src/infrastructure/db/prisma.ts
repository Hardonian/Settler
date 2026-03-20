import { PrismaClient } from "@prisma/client";
import { config } from "../../config";

// Global variable to prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Prisma Client Singleton
 *
 * Ensures only one instance of Prisma Client is created.
 * Configured with connection pooling based on environment.
 */
const prismaOptions: any = {
  log: config.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
};

export const prisma = globalForPrisma.prisma || new PrismaClient(prismaOptions);

if (config.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
