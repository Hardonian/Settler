/**
 * Verify Runtime Correctness
 *
 * Checks that all API routes have correct runtime declarations:
 * - Routes using Prisma/Node APIs must have `runtime = 'nodejs'`
 * - Routes using Edge APIs can use `runtime = 'edge'` or omit (defaults to nodejs)
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

interface RouteCheck {
  file: string;
  hasRuntime: boolean;
  runtime: string | null;
  usesPrisma: boolean;
  usesNodeApis: boolean;
  needsNodeRuntime: boolean;
  status: "ok" | "missing" | "wrong";
}

const checks: RouteCheck[] = [];

async function checkRoute(filePath: string): Promise<RouteCheck> {
  const content = fs.readFileSync(filePath, "utf-8");
  const usesPrisma = content.includes("prisma") || content.includes("PrismaClient");
  const usesNodeApis =
    content.includes("require(") ||
    content.includes("fs.") ||
    content.includes("path.") ||
    content.includes("process.env") ||
    content.includes("Buffer") ||
    content.includes("crypto.");

  const needsNodeRuntime = usesPrisma || usesNodeApis;

  const runtimeMatch = content.match(/export\s+const\s+runtime\s*=\s*['"]([^'"]+)['"]/);
  const hasRuntime = !!runtimeMatch;
  const runtime = runtimeMatch ? runtimeMatch[1] : null;

  let status: "ok" | "missing" | "wrong" = "ok";
  if (needsNodeRuntime) {
    if (!hasRuntime) {
      status = "missing";
    } else if (runtime !== "nodejs") {
      status = "wrong";
    }
  }

  return {
    file: filePath,
    hasRuntime,
    runtime,
    usesPrisma,
    usesNodeApis,
    needsNodeRuntime,
    status,
  };
}

async function main() {
  console.log("🔍 Checking API route runtime correctness...\n");

  // Find all API route files
  const routeFiles = await glob("packages/web/src/app/api/**/route.ts", {
    cwd: process.cwd(),
    absolute: true,
  });

  console.log(`Found ${routeFiles.length} API route files\n`);

  for (const file of routeFiles) {
    const check = await checkRoute(file);
    checks.push(check);

    if (check.status !== "ok") {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`❌ ${relativePath}`);
      if (check.status === "missing") {
        console.log(`   Missing: export const runtime = 'nodejs';`);
      } else if (check.status === "wrong") {
        console.log(`   Wrong runtime: ${check.runtime} (should be 'nodejs')`);
      }
      console.log(`   Uses Prisma: ${check.usesPrisma}`);
      console.log(`   Uses Node APIs: ${check.usesNodeApis}`);
      console.log("");
    }
  }

  const issues = checks.filter((c) => c.status !== "ok");

  if (issues.length === 0) {
    console.log("✅ All routes have correct runtime declarations!\n");
    process.exit(0);
  } else {
    console.log(`\n❌ Found ${issues.length} route(s) with runtime issues\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
