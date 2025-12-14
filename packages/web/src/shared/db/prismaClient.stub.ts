/**
 * Client-side stub for Prisma Client
 * 
 * This file replaces prismaClient.ts in client bundles.
 * Prisma Client should never be used in the browser.
 */

// Export a stub that throws if accidentally used
export const prisma = new Proxy({} as any, {
  get() {
    throw new Error(
      'Prisma Client cannot be used in the browser. ' +
      'This is a server-only module. ' +
      'If you see this error, ensure you are using dynamic imports ' +
      'and checking for server-side execution before using Prisma.'
    );
  },
});
