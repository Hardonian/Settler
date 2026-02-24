#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const files = globSync("packages/web/src/**/*.{ts,tsx,js,jsx,mjs,cjs}", { nodir: true });
const importRegex =
  /(?:import\s+(?:type\s+)?(?:[^'";]+from\s+)?|export\s+[^'";]*from\s+|require\s*\()\s*['"]([^'"]+)['"]/g;
const violations = [];

for (const file of files) {
  const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  let m;
  while ((m = importRegex.exec(source)) !== null) {
    const spec = m[1];
    const isMarketing =
      file.includes("/app/(marketing)/") ||
      /packages\/web\/src\/app\/(?!app|console|admin|dashboard|api)/.test(file);

    if (
      isMarketing &&
      (spec.startsWith("@/app/app") ||
        spec.startsWith("@/app/console") ||
        spec.startsWith("@/app/admin") ||
        spec.startsWith("@/env/server"))
    ) {
      violations.push(`${file}: forbidden marketing import ${spec}`);
    }

    if (file.includes("/app/oss/") && spec.includes("/enterprise")) {
      violations.push(`${file}: OSS importing enterprise module ${spec}`);
    }
    if (file.includes("/app/enterprise/") && spec.includes("/oss")) {
      violations.push(`${file}: enterprise importing OSS module ${spec}`);
    }
  }
}

if (violations.length) {
  console.error("❌ Site boundary enforcement failed");
  violations.forEach((v) => console.error(` - ${v}`));
  process.exit(1);
}

console.log("✅ Site boundary enforcement passed");
