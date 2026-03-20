/**
 * Simple Route Tester
 * Tests all routes using Node.js fetch
 */

const BASE_URL = "http://localhost:3000";

const routes = {
  // Marketing Routes
  marketing: ["/", "/about", "/pricing", "/docs", "/platform", "/capabilities", "/product"],
  // Console Routes
  console: [
    "/console",
    "/console/dashboard",
    "/console/runs",
    "/console/rules",
    "/console/exceptions",
    "/console/integrations",
    "/console/billing",
  ],
  // Dashboard Routes
  dashboard: ["/dashboard", "/dashboard/settings"],
  // Auth Routes
  auth: ["/login", "/signup", "/forgot-password"],
  // Error Routes
  error: ["/404", "/500"],
};

async function testRoute(path) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${BASE_URL}${path}`, {
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return { path, status: response.status, ok: response.ok };
  } catch (error) {
    return { path, status: 0, error: error.message };
  }
}

async function runTests() {
  console.log("Testing routes on", BASE_URL);
  console.log("=".repeat(60));

  const allRoutes = [
    ...routes.marketing,
    ...routes.console,
    ...routes.dashboard,
    ...routes.auth,
    ...routes.error,
  ];
  const results = [];

  for (const route of allRoutes) {
    const result = await testRoute(route);
    results.push(result);

    const statusStr = result.status > 0 ? result.status : "ERR";
    const okStr = result.ok ? "✓" : "✗";
    console.log(`${statusStr.padStart(3)} ${okStr} ${route}`);
  }

  console.log("=".repeat(60));

  // Summary
  const failed = results.filter((r) => r.status >= 400 || r.status === 0);
  const success = results.filter((r) => r.status >= 200 && r.status < 400);

  console.log(`Total: ${results.length} | Success: ${success.length} | Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed routes:");
    for (const r of failed) {
      console.log(`  ${r.path} - Status: ${r.status}${r.error ? " Error: " + r.error : ""}`);
    }
  }
}

runTests().catch(console.error);
