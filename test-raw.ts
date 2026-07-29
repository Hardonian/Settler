import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function check() {
  try {
    const res = await prisma.$queryRaw`
          SELECT
            metadata->>'model' as model,
            COUNT(*) as calls,
            SUM(CAST(metadata->>'tokens' AS NUMERIC)) as tokens,
            SUM(CAST(metadata->>'cost' AS NUMERIC)) as cost
          FROM "UsageEvent"
          WHERE "eventType" = 'ai_request'
          GROUP BY metadata->>'model'
        `;
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
