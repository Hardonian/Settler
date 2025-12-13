/**
 * Prisma Client Singleton
 * 
 * Provides a shared Prisma client instance for the Next.js app.
 * Uses the root Prisma schema and generates types from it.
 * 
 * Note: Prisma client is generated from /workspace/prisma/schema.prisma
 * Run `npm run prisma:generate` at the root to generate the client.
 * 
 * IMPORTANT: This file is SERVER-ONLY and should never be imported in client components.
 * Use dynamic imports in client code if absolutely necessary.
 * 
 * This file re-exports from prismaClient.server.ts to maintain backward compatibility.
 */

// Re-export from server-only implementation
export { prisma } from './prismaClient.server';
