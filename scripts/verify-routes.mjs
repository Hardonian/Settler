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
  const server = spawn("pnpm", args, { stdio: "pipe", env: process.env });
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));
  return server;
}

async function main() {
  const server = startWebServer();
  try {
    await waitForServer();
    for (const route of strict200Routes) {
      const res = await fetch(`${base}${route}`, { redirect: "follow" });
      if (res.status !== 200) throw new Error(`${route} => ${res.status}, expected 200`);
      console.log(`✅ ${route} => ${res.status}`);
    }

    const appRes = await fetch(`${base}${appRoute}`, { redirect: "manual" });
    if (![200, 302, 401].includes(appRes.status)) {
      throw new Error(`${appRoute} => ${appRes.status}, expected 200/302/401 and never 500`);
    }
    console.log(`✅ ${appRoute} => ${appRes.status}`);
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(`❌ Route verification failed: ${error.message}`);
  process.exit(1);
});
