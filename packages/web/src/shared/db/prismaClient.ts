/**
 * Prisma Client Singleton
 * 
 * Provides a shared Prisma client instance for the Next.js app.
 * Uses the root Prisma schema and generates types from it.
 * 
 * Note: Prisma client is generated from /workspace/prisma/schema.prisma
 * Run `npm run prisma:generate` at the root to generate the client.
 * 
 * Prisma 7 compatibility: Explicitly provides DATABASE_URL to force binary engine
 * instead of client engine (which requires adapter/accelerateUrl).
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7: Force binary engine by setting environment variable if not already set
// The vercel.json sets PRISMA_CLIENT_ENGINE_TYPE=binary, but we ensure it here too
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
}

// Get DATABASE_URL - Prisma 7 uses client engine by default in some environments
// Providing DATABASE_URL explicitly helps force the binary engine
const databaseUrl = process.env.DATABASE_URL || 
                    process.env.POSTGRES_PRISMA_URL || 
                    process.env.POSTGRES_URL;

// Prisma 7: Explicitly provide datasource URL to force binary engine
// Without this, Prisma may default to client engine which requires adapter/accelerateUrl
const prismaConfig: {
  log?: ('query' | 'error' | 'warn')[];
  datasources?: { db?: { url: string } };
} = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};

// Explicitly set datasource URL to force binary engine
if (databaseUrl) {
  prismaConfig.datasources = {
    db: {
      url: databaseUrl,
    },
  };
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
