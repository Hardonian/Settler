const fs = require("fs");
const path = require("path");

const routesDir = path.join(process.cwd(), "packages", "api", "src", "routes");

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "__tests__") {
        scanDir(fullPath);
      }
    } else if (file.endsWith(".ts")) {
      // Exclude files that are not tenant scoped
      if (
        ["auth.ts", "health.ts", "worker-health.ts"].some((exempt) => fullPath.endsWith(exempt))
      ) {
        continue;
      }

      let content = fs.readFileSync(fullPath, "utf8");
      let changed = false;

      // 1. Fix Imports
      if (content.includes("import { query } from")) {
        content = content.replace(
          /import\s*{\s*query\s*}\s*from\s*(["'])\.\.\/db\1/,
          'import { queryWithTenant } from "../db"'
        );
        content = content.replace(
          /import\s*{\s*query\s*}\s*from\s*(["'])\.\.\/\.\.\/db\1/,
          'import { queryWithTenant } from "../../db"'
        );
        changed = true;
      } else if (content.includes("import { query,")) {
        content = content.replace(/query,/, "queryWithTenant,");
        changed = true;
      }

      // 2. Replace `query<...>(` but NOT `client.query<...>(`
      // We can use a negative lookbehind, but it's not supported in all JS engines.
      // Better: match characters before `query`. If it's `.` or `client.`, skip.

      const queryRegex = /([^\w\.])query\s*(<[\s\S]*?>)?\s*\(/g;
      content = content.replace(queryRegex, (match, prefix, genericPart) => {
        // if prefix is ".", we might be looking at `client.query`
        if (prefix === ".") return match;
        return `${prefix}queryWithTenant${genericPart || ""}(tenantId, `;
      });

      // 3. Ensure `tenantId` is declared if it's not
      // If we just added `tenantId` to the calls, check if `const tenantId` exists.
      if (content.includes("queryWithTenant(tenantId") && !content.includes("const tenantId")) {
        // This is tricky. Some routes might use `req.tenantId` inline.
        // Let's just find the first req.tenantId! and add a variable, or fallback to manual fix
        // Actually, if it's missing, let's just use `req.tenantId!` directly!
        content = content.replace(/queryWithTenant\(tenantId/g, "queryWithTenant(req.tenantId!");
      } else {
        // if `const tenantId` is found, `tenantId` is valid.
      }

      if (content !== fs.readFileSync(fullPath, "utf8")) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${path.relative(process.cwd(), fullPath)}`);
      }
    }
  }
}

scanDir(routesDir);
