# Fix unused variables
sed -i 's/const prisma = req.prisma;//g' packages/api/src/routes/webhooks.ts
sed -i 's/ catch (error)/ catch (_error)/g' packages/api/src/routes/v1/runs.ts
sed -i 's/ catch (error)/ catch (_error)/g' packages/api/src/middleware/entitlements.ts

# Re-apply the typecheck workaround since the PR might have reset it
echo '
const { PrismaClient, Prisma } = require("@prisma/client");
export { Prisma };
' >> packages/web/src/shared/db/prismaClient.ts
