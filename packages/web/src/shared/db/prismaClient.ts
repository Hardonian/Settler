/**
 * Prisma Client Singleton
 * 
 * Provides a shared Prisma client instance for the Next.js app.
 * Uses the root Prisma schema and generates types from it.
 * 
 * Note: Prisma client is generated from /workspace/prisma/schema.prisma
 * Run `npm run prisma:generate` at the root to generate the client.
 * 
 * Prisma 7 compatibility: The schema uses engineType = "binary" to ensure
 * the standard engine is used. DATABASE_URL is read from environment automatically.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient } from '@prisma/client';

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
