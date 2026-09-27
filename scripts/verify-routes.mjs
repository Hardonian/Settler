import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";
import { spawnManagedProcess, stopManagedProcess } from "./lib/managed-child-process.mjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const port = Number(process.env.PORT || 3210 + Math.floor(Math.random() * 500));
const base = `http://127.0.0.1:${port}`;

const strict200Routes = ["/home", "/docs", "/pricing"];
const non500Routes = [
  "/",
  "/api/v1/health",
  "/api/v1/meta",
  "/app",
  "/app/pipelines",
  "/app/runs",
  "/app/review",
];

async function waitForServer(timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/`, { redirect: "follow" });
      if (res.status < 500) return;
    } catch {
      // keep polling until timeout
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server did not start in time");
}

function startWebServer() {
  const pnpmCommand = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "pnpm";
  const pnpmArgs = (args) =>
    process.platform === "win32" ? ["/d", "/s", "/c", "pnpm", ...args] : args;
  const hasBuild =
    existsSync("packages/web/.next/BUILD_ID") &&
    existsSync("packages/web/.next/prerender-manifest.json");

  if (!hasBuild) {
    console.log("📦 No production build found — building @settler/web first...");
    const buildResult = spawnSync(
      pnpmCommand,
      pnpmArgs(["--filter", "@settler/web", "run", "build"]),
      {
        stdio: "inherit",
        env: { ...process.env, SKIP_ENV_VALIDATION: "true" },
      }
    );
    if (buildResult.status !== 0) {
      console.error("❌ Web build failed — cannot start production server");
      process.exit(1);
    }
  }

  const args = ["--filter", "@settler/web", "run", "start", "-p", String(port)];

  const server = spawnManagedProcess(pnpmCommand, pnpmArgs(args), {
    stdio: "pipe",
    env: {
      ...process.env,
      SETTLER_VERIFY_MODE: "1",
      PORT: String(port),
      NEXT_TURBOPACK: hasBuild ? undefined : "0",
    },
  });
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));

  process.on("SIGINT", async () => {
    await stopManagedProcess(server);
    process.exit(1);
  });

  return server;
}

async function verifyRoute(route, allowedStatuses) {
  const res = await fetch(`${base}${route}`, { redirect: "manual" });
  if (!allowedStatuses.includes(res.status)) {
    throw new Error(`${route} => ${res.status}, expected one of ${allowedStatuses.join(", ")}`);
  }
  console.log(`✅ ${route} => ${res.status}`);
}

async function main() {
  const server = startWebServer();
  try {
    await waitForServer();

    for (const route of strict200Routes) {
      await verifyRoute(route, [200]);
    }

    for (const route of non500Routes) {
      await verifyRoute(route, [200, 302, 307, 401, 403, 404]);
    }

    // A readiness endpoint is healthy as a route even when it truthfully
    // reports unavailable local dependencies.
    await verifyRoute("/api/v1/ready", [200, 503]);

    console.log("✅ Route verification completed without hard-500 responses on critical routes");
  } finally {
    await stopManagedProcess(server);
  }
}

main().catch((error) => {
  console.error(`❌ Route verification failed: ${error.message}`);
  process.exit(1);
});
