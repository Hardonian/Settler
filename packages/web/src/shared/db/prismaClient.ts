/**
 * Prisma Client Singleton
 * 
 * Provides a shared Prisma client instance for the Next.js app.
 * Uses the root Prisma schema and generates types from it.
 * 
 * Note: Prisma client is generated from /workspace/prisma/schema.prisma
 * Run `npm run prisma:generate` at the root to generate the client.
 * 
 * Prisma 7 compatibility: 
 * - Forces binary engine by ensuring DATABASE_URL is available
 * - Prisma 7 uses client engine in edge/serverless environments by default
 * - Setting DATABASE_URL explicitly helps force binary engine usage
 */

// CRITICAL: Set environment variables BEFORE importing PrismaClient
// Prisma 7 determines engine type at import time, so we must set these first
if (typeof process !== 'undefined' && process.env) {
  // Force binary engine - this must be set before PrismaClient is imported
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
  }
  
  // Ensure Node.js runtime is detected (not edge)
  // Prisma 7 uses client engine in edge/serverless environments
  if (!process.env.NEXT_RUNTIME) {
    process.env.NEXT_RUNTIME = 'nodejs';
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// PrismaClient configuration
// Note: In Prisma 7, if the client was generated with "client" engine type,
// we must provide either adapter or accelerateUrl. Since we generate with
// PRISMA_CLIENT_ENGINE_TYPE=binary, this should not be needed, but we handle
// it as a safety measure during build time.
const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};

// During build time, if Prisma detects edge environment and uses client engine,
// we need to provide adapter or accelerateUrl. Since we don't have these in build,
// we ensure PRISMA_CLIENT_ENGINE_TYPE=binary is set (done above) to force binary engine.
// If for some reason client engine is still used, we'd need to provide configuration here.

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
