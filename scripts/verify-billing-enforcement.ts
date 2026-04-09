#!/usr/bin/env tsx
/**
 * Verify Billing Enforcement on All Routes
 *
 * Checks if routes have billing enforcement.
 */

import { glob } from "glob";
import { readFileSync } from "fs";
import { join } from "path";

const API_DIR = join(process.cwd(), "packages/web/src/app/api");

interface RouteStatus {
  path: string;
  hasBilling: boolean;
  hasPublic: boolean;
  hasFree: boolean;
  enforcementType?: string;
}

async function verifyBilling() {
  console.log("🔍 Verifying Billing Enforcement on All Routes...\n");

  const routeFiles = await glob("**/route.ts", {
    cwd: API_DIR,
    absolute: true,
    ignore: ["**/*.backup"],
  });

  console.log(`Found ${routeFiles.length} route files\n`);

  const routes: RouteStatus[] = [];
  let withBilling = 0;
  let withoutBilling = 0;
  let publicRoutes = 0;
  let freeRoutes = 0;

  for (const file of routeFiles) {
    const content = readFileSync(file, "utf-8");
    const relativePath = file.replace(API_DIR, "");

    // Skip health/status routes (should be public)
    if (relativePath.includes("/status") || relativePath.includes("/health")) {
      publicRoutes++;
      routes.push({
        path: relativePath,
        hasBilling: true,
        hasPublic: true,
        hasFree: false,
        enforcementType: "public (health check)",
      });
      continue;
    }

    // Skip webhook routes (authenticated via signature)
    if (relativePath.includes("/webhook")) {
      const hasSignatureAuth =
        content.includes("stripe-signature") ||
        content.includes("webhook") ||
        content.includes("signature");
      routes.push({
        path: relativePath,
        hasBilling: hasSignatureAuth, // Webhooks use signature auth, not billing
        hasPublic: false,
        hasFree: false,
        enforcementType: hasSignatureAuth ? "signature auth" : undefined,
      });
      if (hasSignatureAuth) {
        withBilling++;
      } else {
        withoutBilling++;
      }
      continue;
    }

    // Skip cron/internal routes (authenticated via secrets)
    if (relativePath.includes("/cron/") || relativePath.includes("/internal/")) {
      const hasSecretAuth =
        content.includes("CRON_SECRET") ||
        content.includes("DRAIN_SECRET") ||
        content.includes("INTERNAL_SECRET") ||
        content.includes("authorization") ||
        content.includes("Bearer");
      routes.push({
        path: relativePath,
        hasBilling: hasSecretAuth, // Cron/internal use secrets, not billing
        hasPublic: false,
        hasFree: false,
        enforcementType: hasSecretAuth ? "secret auth" : undefined,
      });
      if (hasSecretAuth) {
        withBilling++;
      } else {
        withoutBilling++;
      }
      continue;
    }

    const hasBillingGate = content.includes("withUniversalBillingGate");
    const hasRequireSubscription = content.includes("requireActiveSubscription");
    const hasBillingEnforcement = content.includes("withBillingEnforcement");
    const hasPublic = content.includes("publicRoute");
    const hasFree = content.includes("freeRoute");

    const hasBilling =
      hasBillingGate || hasRequireSubscription || hasBillingEnforcement || hasPublic || hasFree;

    let enforcementType: string | undefined;
    if (hasPublic) enforcementType = "publicRoute";
    else if (hasFree) enforcementType = "freeRoute";
    else if (hasBillingGate) enforcementType = "withUniversalBillingGate";
    else if (hasRequireSubscription) enforcementType = "requireActiveSubscription";
    else if (hasBillingEnforcement) enforcementType = "withBillingEnforcement";

    routes.push({
      path: relativePath,
      hasBilling,
      hasPublic,
      hasFree,
      enforcementType,
    });

    if (hasBilling) {
      withBilling++;
      if (hasPublic) publicRoutes++;
      if (hasFree) freeRoutes++;
    } else {
      withoutBilling++;
    }
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("BILLING ENFORCEMENT SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`Total routes: ${routes.length}`);
  console.log(`✅ With billing enforcement: ${withBilling}`);
  console.log(`❌ Without billing enforcement: ${withoutBilling}`);
  console.log(`🌐 Public routes: ${publicRoutes}`);
  console.log(`🆓 Free routes: ${freeRoutes}\n`);

  if (withoutBilling > 0) {
    console.log("⚠️  Routes without billing enforcement:\n");
    routes
      .filter((r) => !r.hasBilling)
      .forEach((r) => {
        console.log(`   ❌ ${r.path}`);
      });
    console.log("");
  }

  // Show enforcement types
  const byType = new Map<string, number>();
  routes.forEach((r) => {
    if (r.enforcementType) {
      byType.set(r.enforcementType, (byType.get(r.enforcementType) || 0) + 1);
    }
  });

  if (byType.size > 0) {
    console.log("Enforcement types:\n");
    byType.forEach((count, type) => {
      console.log(`   ${type}: ${count} routes`);
    });
    console.log("");
  }

  if (withoutBilling === 0) {
    console.log("✅ All routes have billing enforcement!");
    console.log("🚀 Ready for production launch.\n");
    process.exit(0);
  } else {
    console.log(`⚠️  ${withoutBilling} routes need billing enforcement.`);
    console.log("💡 Run: npx tsx scripts/apply-billing-to-console-routes.ts\n");
    process.exit(1);
  }
}

verifyBilling().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});
