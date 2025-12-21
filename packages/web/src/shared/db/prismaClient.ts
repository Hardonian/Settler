/**
 * Prisma Client Singleton - Optimized
 *
 * Provides a shared Prisma client instance for the Next.js app.
 */

// Force Node.js runtime environment for Prisma
if (typeof process !== 'undefined' && process.env) {
  process.env.NEXT_RUNTIME = 'nodejs';
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
}

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use bracket notation to prevent webpack from optimizing process.env access
const nodeEnv = typeof process !== 'undefined' && process.env ? process.env['NODE_ENV'] : 'production';

// Optimize DATABASE_URL with connection pooling parameters
function getOptimizedDatabaseUrl(): string | undefined {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) {
    return dbUrl;
  }

  // Parse URL to add connection pool parameters
  try {
    const url = new URL(dbUrl);

    // Add connection pool parameters for optimal performance
    url.searchParams.set('connection_limit', '5'); // Conservative for serverless
    url.searchParams.set('pool_timeout', '20'); // 20 seconds
    url.searchParams.set('connect_timeout', '10'); // 10 seconds
    url.searchParams.set('statement_timeout', '30000'); // 30 seconds query timeout

    return url.toString();
  } catch {
    return dbUrl;
  }
}

const optimizedDbUrl = getOptimizedDatabaseUrl();

// PrismaClient configuration
const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  datasources: optimizedDbUrl ? {
    db: {
      url: optimizedDbUrl,
    },
  } : undefined,
};

// Create Prisma client instance
const prismaInstance = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

export const prisma = prismaInstance;

if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prismaInstance.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[Prisma] Connection health check failed:', error);
    return false;
  }
}
