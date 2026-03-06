#!/usr/bin/env node
/**
 * Marketing CTA smoke verifier.
 *
 * Ensures homepage CTA and navigation target routes resolve without hard-500s.
 */

const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const requiredRoutes = [
  "/",
  "/home",
  "/architecture",
  "/docs",
  "/contact",
  "/pricing",
  "/product",
  "/status",
  "/legal",
  "/privacy",
  "/specs/openapi.yaml",
  "/why-settler",
];

async function check(path) {
  const url = new URL(path, baseUrl).toString();
  const response = await fetch(url, { redirect: "follow" });
  return {
    path,
    status: response.status,
    ok: response.status >= 200 && response.status < 500,
  };
}

async function run() {
  console.log(`🔎 Marketing CTA smoke against ${baseUrl}`);
  const failures = [];

  for (const route of requiredRoutes) {
    const result = await check(route);
    if (!result.ok) {
      failures.push(result);
      console.error(`❌ ${route} -> ${result.status}`);
      continue;
    }

    console.log(`✅ ${route} -> ${result.status}`);
  }

  if (failures.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log("✨ Marketing CTA smoke passed");
}

run().catch((error) => {
  console.error("Route smoke failed:", error);
  process.exitCode = 1;
});
