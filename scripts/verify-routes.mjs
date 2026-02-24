#!/usr/bin/env node
import { spawn } from "node:child_process";

const port = Number(process.env.PORT || 3210);
const base = `http://127.0.0.1:${port}`;

async function waitForServer(timeoutMs = 30000) {
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

async function main() {
  const server = spawn(
    "pnpm",
    ["--filter", "@settler/web", "exec", "next", "start", "-p", String(port)],
    { stdio: "pipe", env: process.env }
  );
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));

  try {
    await waitForServer();
    for (const route of ["/", "/pricing"]) {
      const res = await fetch(`${base}${route}`, { redirect: "follow" });
      if (res.status !== 200) throw new Error(`${route} returned ${res.status}`);
      console.log(`✅ ${route} => ${res.status}`);
    }
    const appRes = await fetch(`${base}/app`, { redirect: "manual" });
    if (appRes.status >= 500) throw new Error(`/app returned ${appRes.status}`);
    console.log(`✅ /app => ${appRes.status}`);
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
