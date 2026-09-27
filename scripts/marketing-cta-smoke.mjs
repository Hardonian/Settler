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
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    return {
      path,
      status: response.status,
      ok: response.status >= 200 && response.status < 500,
      error: null,
    };
  } catch (error) {
    return {
      path,
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function run() {
  console.log(`🔎 Marketing CTA smoke against ${baseUrl}`);
  const failures = [];

  const results = await Promise.all(requiredRoutes.map(check));
  for (const result of results) {
    if (!result.ok) {
      failures.push(result);
      console.error(`❌ ${result.path} -> ${result.status ?? result.error}`);
      continue;
    }

    console.log(`✅ ${result.path} -> ${result.status}`);
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
