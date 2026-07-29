import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// Checking if we can group by JSON field in prisma pg
async function check() {
  try {
    const res = await prisma.$queryRaw`
          SELECT
            metadata->>'model' as model,
            COUNT(*) as calls,
            SUM(CAST(metadata->>'tokens' AS NUMERIC)) as tokens,
            SUM(CAST(metadata->>'cost' AS NUMERIC)) as cost
          FROM "UsageEvent"
          WHERE event_type = 'ai_request'
          GROUP BY metadata->>'model'
        `;
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
