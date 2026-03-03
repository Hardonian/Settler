#!/usr/bin/env node
import { existsSync } from "node:fs";

if (!existsSync("packages/web/src/app/openapi.json/route.ts")) {
  console.error("Missing /openapi.json route");
  process.exit(1);
}

const required = [
  "packages/web/src/app/api/v1/runs/route.ts",
  "packages/web/src/app/api/v1/runs/[id]/route.ts",
  "packages/web/src/app/api/v1/runs/[id]/results/route.ts",
  "packages/web/src/app/api/v1/runs/[id]/evidence/route.ts",
  "packages/web/src/app/api/v1/runs/[id]/replay/route.ts",
  "packages/web/src/app/api/v1/datasets/route.ts",
  "packages/web/src/app/api/v1/health/route.ts",
  "packages/web/src/app/api/v1/ready/route.ts",
  "packages/web/src/app/api/v1/meta/route.ts",
];

for (const file of required) {
  if (!existsSync(file)) {
    console.error(`Missing required API route: ${file}`);
    process.exit(1);
  }
}

console.log("✅ API contract files are present.");
