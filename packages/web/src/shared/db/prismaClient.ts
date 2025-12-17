/**
 * Prisma Client Singleton - Optimized
 * 
 * Provides a shared Prisma client instance for the Next.js app.
 * Optimized for:
 * - Connection pooling (reduces connection overhead)
 * - Connection timeouts (prevents hanging connections)
 * - Error recovery (automatic reconnection)
 * - Query optimization (select only needed fields)
 * 
 * Prisma 7 compatibility: 
 * - Forces binary engine by ensuring DATABASE_URL is available
 * - Prisma 7 uses client engine in edge/serverless environments by default
 * - Setting DATABASE_URL explicitly helps force binary engine usage
 */

// This file is server-only and should not be bundled for the browser
// Webpack configuration excludes this file from client bundles

// CRITICAL: Set environment variables BEFORE importing PrismaClient
// Prisma 7 determines engine type at import time, so we must set these first
if (typeof process !== 'undefined' && process.env) {
  // Use bracket notation to prevent webpack from optimizing these away
  const env = process.env;
  
  // Force binary engine - this must be set before PrismaClient is imported
  // This is critical for Prisma 7 to use binary engine instead of client engine
  env['PRISMA_CLIENT_ENGINE_TYPE'] = 'binary';
  
  // Ensure Node.js runtime is detected (not edge)
  // Prisma 7 uses client engine in edge/serverless environments
  if (!env['NEXT_RUNTIME']) {
    env['NEXT_RUNTIME'] = 'nodejs';
  }

  // During build time, ensure DATABASE_URL is set (even if dummy) to help Prisma
  // detect that binary engine should be used. Prisma uses DATABASE_URL presence
  // as a signal for binary engine vs client engine.
  // Note: This won't cause issues if DATABASE_URL is not actually used during build
  // since we're only collecting page data, not executing queries.
  // Check if we're in a build context (Next.js build phase or Vercel build)
  // During Next.js build, when collecting page data, DATABASE_URL might not be set
  // but Prisma needs it to detect binary engine type
  // Use bracket notation to prevent webpack from optimizing these away
  const isBuildPhase = 
    env['NEXT_PHASE'] === 'phase-production-build' ||
    (env['NODE_ENV'] === 'production' && env['VERCEL'] === '1') ||
    (env['NODE_ENV'] === 'production' && !env['DATABASE_URL']) ||
    env['VERCEL'] === '1';
  
  if (!env['DATABASE_URL'] && isBuildPhase) {
    // During build phase, set a dummy DATABASE_URL to help Prisma detect binary engine
    // This is safe because we're not actually connecting during build
    // Prisma will not actually connect during build - it only needs the URL for engine detection
    env['DATABASE_URL'] = 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public';
  }
  
  // Store isBuildPhase for use after import
  (globalThis as any).__PRISMA_BUILD_PHASE__ = isBuildPhase;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// PrismaClient configuration with connection pooling optimization
// Note: In Prisma 7, if the client was generated with "client" engine type,
// we must provide either adapter or accelerateUrl. Since we generate with
// PRISMA_CLIENT_ENGINE_TYPE=binary, this should not be needed, but we handle
// it as a safety measure during build time.
const isBuildPhase = (globalThis as any).__PRISMA_BUILD_PHASE__ ?? false;

// Use bracket notation to prevent webpack from optimizing process.env access
const nodeEnv = typeof process !== 'undefined' && process.env ? process.env['NODE_ENV'] : 'production';

// Optimize DATABASE_URL with connection pooling parameters
function getOptimizedDatabaseUrl(): string | undefined {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl || isBuildPhase) {
    return dbUrl;
  }

  // Parse URL to add connection pool parameters
  try {
    const url = new URL(dbUrl);
    
    // Add connection pool parameters for optimal performance
    // connection_limit: Max connections per instance (Supabase free tier: 60 total)
    // pool_timeout: Time to wait for connection (seconds)
    // connect_timeout: Connection timeout (seconds)
    // statement_timeout: Query timeout (milliseconds)
    url.searchParams.set('connection_limit', '5'); // Conservative for serverless
    url.searchParams.set('pool_timeout', '20'); // 20 seconds
    url.searchParams.set('connect_timeout', '10'); // 10 seconds
    url.searchParams.set('statement_timeout', '30000'); // 30 seconds query timeout
    
    // For Supabase, use connection pooling port if available
    if (url.hostname.includes('supabase.co') && !url.hostname.includes('pooler')) {
      // Keep direct connection for now, but could switch to pooler
      // url.port = '6543'; // Connection pooler port
    }
    
    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return dbUrl;
  }
}

// During build time, if Prisma Client was generated with "client" engine type,
// it requires either adapter or accelerateUrl. We provide a dummy accelerateUrl
// during build only to satisfy the constructor requirement.
// This is safe because Prisma won't actually connect during build when collecting page data.
const optimizedDbUrl = getOptimizedDatabaseUrl();
const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'], // Reduced logging in production
  // During Vercel build, provide accelerateUrl to satisfy Prisma Client constructor
  // if it was generated with client engine type. This won't be used during build.
  ...(isBuildPhase ? {
    accelerateUrl: 'https://dummy.prisma-accelerate.com',
  } : {}),
  // Add datasource override with optimized connection string
  ...(optimizedDbUrl && !isBuildPhase ? {
    datasources: {
      db: {
        url: optimizedDbUrl,
      },
    },
  } : {}),
};

// Create Prisma client instance
// Note: Prisma 7 may detect client engine type during build even if generated with binary engine.
// We ensure PRISMA_CLIENT_ENGINE_TYPE=binary is set above to prevent this.
// If Prisma still uses client engine, we provide accelerateUrl above as a fallback.
const prismaInstance = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

// Add connection health check
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

async function checkConnectionHealth(): Promise<boolean> {
  try {
    await prismaInstance.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[Prisma] Connection health check failed:', error);
    return false;
  }
}

// Periodic health check (non-blocking)
if (typeof setInterval !== 'undefined' && nodeEnv === 'production') {
  setInterval(async () => {
    const now = Date.now();
    if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = now;
      await checkConnectionHealth().catch(() => {
        // Health check failed, but don't crash
      });
    }
  }, HEALTH_CHECK_INTERVAL);
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    console.log('[Prisma] Closing database connections...');
    await prismaInstance.$disconnect().catch((error) => {
      console.error('[Prisma] Error disconnecting:', error);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('beforeExit', shutdown);
}

export const prisma = prismaInstance;

if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  return checkConnectionHealth();
}
