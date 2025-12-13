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
 */

import 'server-only';
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Detect if we're in a build phase (Next.js collecting page data)
// During build, Prisma may detect "client" engine type and require accelerateUrl
// In Vercel builds, we always provide accelerateUrl to prevent constructor validation errors
const isBuildPhase = 
  typeof process !== 'undefined' &&
  process.env &&
  (process.env.VERCEL === '1' || process.env.NEXT_PHASE === 'phase-production-build');

// PrismaClient configuration
// During build phase (especially Vercel), always provide accelerateUrl to satisfy Prisma's client engine requirement
// This is safe because Next.js only collects page data during build, not executing queries
// The accelerateUrl won't be used since we're not actually connecting during build
const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Always provide accelerateUrl during build to satisfy Prisma client engine constructor
  // This prevents "PrismaClientConstructorValidationError" during Next.js page data collection
  // Note: This is a dummy URL and won't be used during build since no queries are executed
  ...(isBuildPhase ? { accelerateUrl: 'https://dummy.prisma-accelerate.com' } : {}),
};

// Create Prisma client instance
const prismaInstance = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
