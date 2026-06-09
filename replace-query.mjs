import fs from "fs";
const file =
  "c:/Users/scott/GitHub/Settler/packages/api/src/services/ingestion/reconciliation-matcher.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /import \{ query, transaction \} from "\.\.\/\.\.\/db";/g,
  'import { queryWithTenant as query, transactionWithTenant as transaction } from "../../db";'
);

content = content.replace(/await query\(/g, "await query(tenantId, ");
content = content.replace(/await transaction\(/g, "await transaction(tenantId, ");

fs.writeFileSync(file, content);
console.log("Replaced successfully!");
