/**
 * Safe Prisma Client Accessor
 * 
 * Provides a safe way to access Prisma that never throws during import.
 * This ensures pages can render even if Prisma fails to initialize.
 */

import type { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;
let prismaError: Error | null = null;

// Lazy load Prisma to avoid import-time failures
async function getPrismaClient(): Promise<PrismaClient | null> {
  if (prismaInstance) {
    return prismaInstance;
  }
  
  if (prismaError) {
    return null;
  }
  
  try {
    // Dynamic import to avoid module-level failures
    const { prisma } = (await import('./prismaClient')) as { prisma: PrismaClient };
    prismaInstance = prisma;
    return prisma;
  } catch (error) {
    prismaError = error instanceof Error ? error : new Error('Failed to load Prisma');
    console.error('[PrismaSafe] Failed to load Prisma client:', prismaError);
    return null;
  }
}

/**
 * Safely access Prisma client
 * Returns null if Prisma is unavailable
 */
export async function getPrismaSafe() {
  return getPrismaClient();
}

/**
 * Check if Prisma is available
 */
export async function isPrismaAvailable(): Promise<boolean> {
  const client = await getPrismaClient();
  return client !== null;
}
