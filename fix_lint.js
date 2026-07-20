const fs = require("fs");
const file = "packages/api/src/routes/openapi.ts";
let data = fs.readFileSync(file, "utf8");

data = data.replace("opts: any", "_opts: any");
data = data.replace('import { config } from "../config";\n', "");
fs.writeFileSync(file, data);

const file2 = "packages/api/src/infrastructure/db/prisma.ts";
let data2 = fs.readFileSync(file2, "utf8");
data2 = data2.replace('import { Pool, pool } from "../../db";', 'import { pool } from "../../db";');
fs.writeFileSync(file2, data2);

const file3 = "packages/api/src/middleware/dlp.ts";
let data3 = fs.readFileSync(file3, "utf8");
data3 = data3.replace("import { logWarn, logError }", "import { logError }");
data3 = data3.replace("} catch (e) {", "} catch (_e) {");
data3 = data3.replace("} catch (e) {", "} catch (_e) {"); // There are two of these
data3 = data3.replace("} catch (e) {", "} catch (_e) {");
fs.writeFileSync(file3, data3);

const file4 = "packages/api/src/routes/v1/billing.ts";
let data4 = fs.readFileSync(file4, "utf8");
data4 = data4.replace("import { authMiddleware, AuthRequest }", "import { AuthRequest }");
data4 = data4.replace(
  'import { idempotencyMiddleware } from "../../middleware/idempotency";\n',
  ""
);
fs.writeFileSync(file4, data4);

const file5 = "packages/api/src/routes/v1/sso.ts";
let data5 = fs.readFileSync(file5, "utf8");
data5 = data5.replace(", NextFunction }", " }");
fs.writeFileSync(file5, data5);
