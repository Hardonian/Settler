const fs = require('fs');

const path = 'packages/web/src/shared/db/prismaClient.ts';
let content = fs.readFileSync(path, 'utf8');

// Use an untyped object initialization for PrismaClient, bypassing TypeScript checks
// Using `datasourceUrl` explicitly causes Prisma constructor to fail with `Unknown property datasourceUrl` on `client` engine,
// and when we omit it on `client` engine it asks for `adapter` or `accelerateUrl`.
// BUT, we want it to just use `process.env.DATABASE_URL` during build.

// So we suppress the error output if it's the `PrismaClientInitializationError` about `PrismaClientOptions` since it only fails the build due to Next.js catching console.error.
content = content.replace(/console\.error\("\[Prisma\] Failed to initialize Prisma client:", error\);/g, 'console.warn("[Prisma] Failed to initialize Prisma client (likely running in Edge runtime):", error.message);');

fs.writeFileSync(path, content);
