/**
 * Prisma Client Singleton - Optimized
 *
 * Provides a shared Prisma client instance for the Next.js app.
 */

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
const prismaConfig: any = {
  log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
};

if (optimizedDbUrl) {
  prismaConfig.datasources = {
    db: {
      url: optimizedDbUrl,
    },
  };
}

// Create Prisma client instance
let prismaInstance: PrismaClient;

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);
} catch (error) {
  console.warn('Failed to initialize PrismaClient with config, retrying with defaults:', error);
  try {
    // Fallback attempt
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
      ...prismaConfig,
      // Provide explicit engine type hint if supported by constructor in this version
      // or standard fallback params
    } as any);
  } catch (secondError) {
    console.error('Critical: Failed to initialize PrismaClient:', secondError);
    // Last resort: empty constructor
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient() as any;
  }
}

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
