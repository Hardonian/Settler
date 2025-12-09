/**
 * Prisma Client Singleton
 * 
 * Provides a shared Prisma client instance for the Next.js app.
 * Uses the root Prisma schema and generates types from it.
 * 
 * Note: Prisma client is generated from /workspace/prisma/schema.prisma
 * Run `npm run prisma:generate` at the root to generate the client.
 * 
 * IMPORTANT: Prisma must be installed and client generated before this will work.
 * See docs/settler-receipts-feature-flags-setup.md for setup instructions.
 */

import type { PrismaClient as PrismaClientType } from '@prisma/client';

// Dynamic import to handle case where Prisma client isn't generated yet
let PrismaClient: typeof PrismaClientType;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  throw new Error(
    'Prisma client not found. Please run: npm install -D prisma @prisma/client && npm run prisma:generate'
  );
}

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
