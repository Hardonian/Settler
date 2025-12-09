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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7: Force binary engine by ensuring we're not in an edge environment
// Prisma 7 automatically uses "client" engine in edge/serverless environments
// We explicitly set the environment to Node.js to force binary engine
if (typeof process !== 'undefined' && process.env) {
  // Ensure we're not detected as edge runtime
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL && !process.env.POSTGRES_URL) {
    // During build, if DATABASE_URL is not available, we can't use Prisma
    // This should not happen in production, but we handle it gracefully
    console.warn('⚠️  DATABASE_URL not found. Prisma may use client engine which requires adapter/accelerateUrl.');
  }
  
  // Force binary engine by ensuring PRISMA_CLIENT_ENGINE_TYPE is set
  // This is set during prisma generate, but we ensure it here too
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
