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

// PrismaClient configuration
const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};

// Create Prisma client instance
const prismaInstance = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
