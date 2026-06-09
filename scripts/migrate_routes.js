const fs = require("fs");
const path = require("path");

const routesDir = path.join(process.cwd(), "packages", "api", "src", "routes");

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf8");
      let changed = false;

      // 1. Replace import { query } from "../db"
      if (content.includes("import { query } from")) {
        content = content.replace(
          /import\s+{\s*query\s*}\s+from\s+["']\.\.\/db["']/,
          'import { queryWithTenant } from "../db"'
        );
        changed = true;
      } else if (content.includes("import { query,")) {
        content = content.replace(/query,/, "queryWithTenant,");
        changed = true;
      }

      // 2. Replace query calls. Pattern: query<OptionalType>(`...`) or query(`...`)
      // Note: we assume tenantId or req.tenantId is available in scope.
      // Usually it's `const tenantId = req.tenantId!`

      const queryCallRegex = /query\s*(<[^>]+>)?\s*\(/g;

      content = content.replace(queryCallRegex, (match, genericPart) => {
        // match is something like `query<Type>(` or `query(`
        // we want `queryWithTenant<Type>(tenantId, `
        // But wait! Is tenantId defined?
        // If it's auth.ts or health.ts, they shouldn't be tenant-scoped. We will skip those.
        const isExempt = ["auth.ts", "health.ts", "worker-health.ts"].some((exempt) =>
          fullPath.endsWith(exempt)
        );
        if (isExempt) {
          return match; // don't change
        }

        return `queryWithTenant${genericPart || ""}(tenantId, `;
      });

      // Special case: some files use req.tenantId directly if they didn't alias it.
      // We will blindly insert `tenantId` and see if TSC complains. If it does, we can fix those manually.

      // We also need to fix the case where we just replaced the import in exempt files
      const isExempt = ["auth.ts", "health.ts", "worker-health.ts"].some((exempt) =>
        fullPath.endsWith(exempt)
      );
      if (isExempt) {
        // revert import change for exempt files
        content = fs.readFileSync(fullPath, "utf8");
        changed = false;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${path.relative(process.cwd(), fullPath)}`);
      }
    }
  }
}

scanDir(routesDir);
