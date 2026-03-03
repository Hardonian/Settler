#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

const port = Number(process.env.PORT || 3210);
const base = `http://127.0.0.1:${port}`;

const strict200Routes = ["/", "/docs"];
const non500Routes = [
  "/api/v1/health",
  "/api/v1/ready",
  "/api/v1/meta",
  "/openapi.json",
  "/app",
  "/app/assistant",
  "/app/pipelines",
  "/app/runs",
  "/app/review-queue",
  "/app/pipelines/demo-pipeline",
];

async function waitForServer(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/`, { redirect: "follow" });
      if (res.status < 500) return;
    } catch {}
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

  if (!hasBuild) {
    console.log("ℹ️ No production build found; using next dev for route smoke verification.");
  }

  const server = spawn("pnpm", args, { stdio: "pipe", env: process.env });
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));
  return server;
}

async function assertRouteStatus(route, mode) {
  const res = await fetch(`${base}${route}`, {
    redirect: mode === "strict" ? "follow" : "manual",
  });

  if (mode === "strict") {
    if (res.status !== 200) {
      throw new Error(`${route} returned ${res.status} (expected 200)`);
    }
  } else if (res.status >= 500) {
    throw new Error(`${route} returned ${res.status} (must not hard-500)`);
  }

  console.log(`✅ ${route} => ${res.status}`);
}

async function main() {
  const server = startWebServer();

  try {
    await waitForServer();

    for (const route of strict200Routes) {
      await assertRouteStatus(route, "strict");
    }

    for (const route of non500Routes) {
      await assertRouteStatus(route, "non500");
    }
  } finally {
    server.kill("SIGTERM");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`❌ Route verification failed: ${error.message}`);
    process.exit(1);
  });
