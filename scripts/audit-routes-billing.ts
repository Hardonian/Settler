#!/usr/bin/env tsx
/**
 * Route Billing Enforcement Audit Script
 *
 * Scans all API routes and identifies which ones lack billing enforcement.
 * Outputs a report of routes that need billing gates.
 */

import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { glob } from "glob";

interface RouteInfo {
  path: string;
  hasBillingEnforcement: boolean;
  hasPublicMarker: boolean;
  hasFreeMarker: boolean;
  enforcementType?:
    | "requireActiveSubscription"
    | "withBillingEnforcement"
    | "withSubscriptionGate"
    | "withUniversalBillingGate"
    | "publicRoute"
    | "freeRoute";
  lineNumbers: number[];
}

async function findRouteFiles(): Promise<string[]> {
  const apiDir = join(process.cwd(), "packages/web/src/app/api");
  const files = await glob("**/route.ts", { cwd: apiDir, absolute: true });
  return files;
}

async function auditRoute(filePath: string): Promise<RouteInfo> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  const info: RouteInfo = {
    path: filePath.replace(process.cwd(), ""),
    hasBillingEnforcement: false,
    hasPublicMarker: false,
    hasFreeMarker: false,
    lineNumbers: [],
  };

  // Check for various billing enforcement patterns
  const patterns = [
    { name: "requireActiveSubscription", regex: /requireActiveSubscription/ },
    { name: "withBillingEnforcement", regex: /withBillingEnforcement/ },
    { name: "withSubscriptionGate", regex: /withSubscriptionGate/ },
    { name: "withUniversalBillingGate", regex: /withUniversalBillingGate/ },
    { name: "publicRoute", regex: /publicRoute\s*\(/ },
    { name: "freeRoute", regex: /freeRoute\s*\(/ },
  ];

  lines.forEach((line, index) => {
    patterns.forEach((pattern) => {
      if (pattern.regex.test(line)) {
        info.hasBillingEnforcement = true;
        info.enforcementType = pattern.name as RouteInfo["enforcementType"];
        info.lineNumbers.push(index + 1);
      }
    });

    // Check for public/free markers in comments
    if (/\/\/\s*(public|free|no.*billing|allow.*public)/i.test(line)) {
      if (/public/i.test(line)) {
        info.hasPublicMarker = true;
      }
      if (/free/i.test(line)) {
        info.hasFreeMarker = true;
      }
    }
  });

  return info;
}

async function main() {
  console.log("🔍 Auditing API routes for billing enforcement...\n");

  const routeFiles = await findRouteFiles();
  console.log(`Found ${routeFiles.length} route files\n`);

  const results: RouteInfo[] = [];
  for (const file of routeFiles) {
    const info = await auditRoute(file);
    results.push(info);
  }

  // Categorize routes
  const withEnforcement = results.filter((r) => r.hasBillingEnforcement);
  const withoutEnforcement = results.filter((r) => !r.hasBillingEnforcement);
  const publicRoutes = results.filter(
    (r) => r.hasPublicMarker || r.enforcementType === "publicRoute"
  );
  const freeRoutes = results.filter((r) => r.hasFreeMarker || r.enforcementType === "freeRoute");

  // Print report
  console.log("═══════════════════════════════════════════════════════════");
  console.log("BILLING ENFORCEMENT AUDIT REPORT");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`Total Routes: ${results.length}`);
  console.log(`With Billing Enforcement: ${withEnforcement.length}`);
  console.log(`Without Billing Enforcement: ${withoutEnforcement.length}`);
  console.log(`Public Routes (intentionally free): ${publicRoutes.length}`);
  console.log(`Free Routes (usage-limited): ${freeRoutes.length}\n`);

  if (withoutEnforcement.length > 0) {
    console.log("🚨 ROUTES WITHOUT BILLING ENFORCEMENT:\n");
    withoutEnforcement.forEach((route) => {
      console.log(`  ❌ ${route.path}`);
      if (route.hasPublicMarker || route.hasFreeMarker) {
        console.log(`     ⚠️  Has public/free marker but no enforcement wrapper`);
      }
    });
    console.log("");
  }

  if (withEnforcement.length > 0) {
    console.log("✅ ROUTES WITH BILLING ENFORCEMENT:\n");
    const byType = new Map<string, RouteInfo[]>();
    withEnforcement.forEach((route) => {
      const type = route.enforcementType || "unknown";
      if (!byType.has(type)) {
        byType.set(type, []);
      }
      byType.get(type)!.push(route);
    });

    byType.forEach((routes, type) => {
      console.log(`  ${type}: ${routes.length} routes`);
    });
    console.log("");
  }

  // Generate fix recommendations
  console.log("═══════════════════════════════════════════════════════════");
  console.log("RECOMMENDATIONS");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("1. Add billing enforcement to all routes without it");
  console.log("2. Use withUniversalBillingGate() as default");
  console.log("3. Explicitly mark public routes with publicRoute()");
  console.log("4. Explicitly mark free routes with freeRoute()");
  console.log("5. Remove routes that cannot justify billing\n");

  // List routes that should be deleted
  const routesToDelete = withoutEnforcement.filter((r) => {
    const path = r.path.toLowerCase();
    return (
      path.includes("/investor/") ||
      path.includes("/marketing/") ||
      path.includes("/sales/") ||
      path.includes("/ai/chatbot") ||
      path.includes("/analytics/") ||
      path.includes("/experiments/") ||
      path.includes("/console/site/") ||
      path.includes("/console/ops-") ||
      path.includes("/admin/") ||
      (path.includes("/playground/") && !path.includes("public"))
    );
  });

  if (routesToDelete.length > 0) {
    console.log("🗑️  ROUTES TO DELETE (speculative/non-core):\n");
    routesToDelete.forEach((route) => {
      console.log(`  - ${route.path}`);
    });
    console.log("");
  }

  // Exit with error code if routes need fixing
  if (withoutEnforcement.length > publicRoutes.length + freeRoutes.length) {
    console.log(
      `\n❌ ${withoutEnforcement.length - publicRoutes.length - freeRoutes.length} routes need billing enforcement`
    );
    process.exit(1);
  } else {
    console.log("\n✅ All routes have appropriate billing enforcement");
    process.exit(0);
  }
}

main().catch(console.error);
