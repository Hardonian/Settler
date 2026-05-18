import fs from "fs";
let path = "packages/web/src/shared/db/prismaClient.ts";
let content = fs.readFileSync(path, "utf8");

// Fix 1: Change `Prisma: typeof import("@prisma/client").Prisma;` back to `Prisma: any;`
content = content.replace(/Prisma: typeof import\("@prisma\/client"\)\.Prisma;/g, "Prisma: any;");

// Fix 2: Cast `error` to `any` on line 99: `(prismaInstance as PrismaClientWithError).__prismaInitError = error;`
content = content.replace(
  /\(prismaInstance as PrismaClientWithError\)\.__prismaInitError = error;/g,
  "(prismaInstance as PrismaClientWithError).__prismaInitError = error as any;"
);

fs.writeFileSync(path, content);
