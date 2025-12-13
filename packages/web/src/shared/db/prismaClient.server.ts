/**
 * Prisma Client Singleton (SERVER-ONLY)
 * 
 * Provides a shared Prisma client instance for server-side use only.
 * This file should NEVER be imported in client components.
 * 
 * Use this in:
 * - API routes
 * - Server components
 * - Server actions
 * 
 * DO NOT use in:
 * - Client components ('use client')
 * - Client-side code
 * 
 * BUILD RESILIENCE:
 * - Handles Prisma engine type detection during build phase
 * - Provides fallback accelerateUrl during Vercel builds
 * - Prevents webpack bundling issues with server-only marker
 * - Graceful error handling for missing configuration
 */

import 'server-only';

// Type-safe environment check
const isServer = typeof window === 'undefined';
const isBuildPhase = 
  isServer &&
  typeof process !== 'undefined' &&
  process.env &&
  (process.env.VERCEL === '1' || 
   process.env.NEXT_PHASE === 'phase-production-build' ||
   process.env.NODE_ENV === 'production');

// Lazy import PrismaClient to avoid issues during build
let PrismaClient: typeof import('@prisma/client').PrismaClient;
let prismaInstance: import('@prisma/client').PrismaClient | null = null;

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: import('@prisma/client').PrismaClient | undefined;
};

/**
 * Get base Prisma configuration
 */
function getBasePrismaConfig() {
  return {
    log: (process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error']) as ('query' | 'error' | 'warn')[],
    // During build phase, provide accelerateUrl to satisfy Prisma client engine constructor
    // This prevents "PrismaClientConstructorValidationError" during Next.js page data collection
    // Safe because Next.js only collects metadata during build, not executing queries
    ...(isBuildPhase ? { 
      accelerateUrl: 'https://dummy.prisma-accelerate.com' 
    } : {}),
  };
}

/**
 * Initialize Prisma Client with build-time resilience
 */
function initializePrismaClient(): import('@prisma/client').PrismaClient {
  // Return existing instance if available
  if (prismaInstance) {
    return prismaInstance;
  }

  // Return global instance in development (hot reload)
  if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }

  const baseConfig = getBasePrismaConfig();

  try {
    // Dynamic import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PrismaModule = require('@prisma/client');
    PrismaClient = PrismaModule.PrismaClient;

    // Create Prisma client instance
    prismaInstance = new PrismaClient(baseConfig as ConstructorParameters<typeof PrismaClient>[0]);

    // Store in global for development hot reload
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }

    // Handle graceful shutdown
    if (typeof process !== 'undefined') {
      process.on('beforeExit', async () => {
        await prismaInstance?.$disconnect();
      });
    }

    return prismaInstance;
  } catch (error) {
    // Enhanced error handling for build-time issues
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a Prisma constructor validation error
    if (errorMessage.includes('PrismaClientConstructorValidationError')) {
      console.error(
        '[Prisma] Constructor validation error detected. ' +
        'This usually happens during build phase when Prisma detects client engine type. ' +
        'Ensure PRISMA_CLIENT_ENGINE_TYPE=binary is set during prisma generate.'
      );
      
      // Retry with accelerateUrl as fallback
      try {
        const PrismaModule = require('@prisma/client');
        PrismaClient = PrismaModule.PrismaClient;
        prismaInstance = new PrismaClient({
          ...getBasePrismaConfig(),
          accelerateUrl: 'https://dummy.prisma-accelerate.com',
        } as ConstructorParameters<typeof PrismaClient>[0]);
        
        if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = prismaInstance;
        }
        
        return prismaInstance;
      } catch (retryError) {
        console.error('[Prisma] Failed to initialize with fallback:', retryError);
        throw retryError;
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Export singleton instance
export const prisma = initializePrismaClient();
