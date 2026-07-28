const fs = require("fs");
const path = "packages/agents/src/security-agent.ts";
let content = fs.readFileSync(path, "utf8");
content = content.replace(
  /import \{ createLogger \} from \"\@settler\/logger\"\;/g,
  'import { appLogger as createLogger } from "../../web/src/lib/utils/logger";'
);
fs.writeFileSync(path, content);
