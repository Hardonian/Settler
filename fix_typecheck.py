import re

with open("packages/web/src/shared/db/prismaClient.ts", "r") as f:
    content = f.read()

# Make sure Prisma is exported properly
content = re.sub(
    r'const { PrismaClient } = require\("@prisma/client"\) as {[^}]+};',
    'const { PrismaClient, Prisma } = require("@prisma/client") as {\n  PrismaClient: typeof import("@prisma/client").PrismaClient;\n  Prisma: typeof import("@prisma/client").Prisma;\n};',
    content
)

with open("packages/web/src/shared/db/prismaClient.ts", "w") as f:
    f.write(content)
