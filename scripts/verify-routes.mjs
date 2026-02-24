#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

const port = Number(process.env.PORT || 3210);
const base = `http://127.0.0.1:${port}`;

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

async function main() {
  const server = startWebServer();

  try {
    await waitForServer();
    for (const route of ["/", "/docs"]) {
      const res = await fetch(`${base}${route}`, { redirect: "follow" });
      if (res.status !== 200) throw new Error(`${route} returned ${res.status}`);
      console.log(`✅ ${route} => ${res.status}`);
    }

    for (const route of ["/app", "/app/pipelines/demo-pipeline"]) {
      const res = await fetch(`${base}${route}`, { redirect: "manual" });
      if (res.status >= 500) throw new Error(`${route} returned ${res.status}`);
      console.log(`✅ ${route} => ${res.status}`);
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
