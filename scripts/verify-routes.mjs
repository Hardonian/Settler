#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

const port = Number(process.env.PORT || 3210);
const base = `http://127.0.0.1:${port}`;

const strict200Routes = ["/home", "/docs", "/pricing"];
const non500Routes = [
  "/",
  "/api/v1/health",
  "/api/v1/ready",
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
  const hasBuild = existsSync("packages/web/.next/BUILD_ID");
  const args = hasBuild
    ? ["--filter", "@settler/web", "exec", "next", "start", "-p", String(port)]
    : [
        "--filter",
        "@settler/web",
        "exec",
        "next",
        "dev",
        "-p",
        String(port),
        "--hostname",
        "127.0.0.1",
      ];

  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "pnpm";
  const commandArgs = isWindows ? ["/c", "pnpm.cmd", ...args] : args;
  const server = spawn(command, commandArgs, {
    stdio: "pipe",
    env: { ...process.env, SETTLER_VERIFY_MODE: "1" },
  });
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));
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

    console.log("✅ Route verification completed without hard-500 responses on critical routes");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(`❌ Route verification failed: ${error.message}`);
  process.exit(1);
});
