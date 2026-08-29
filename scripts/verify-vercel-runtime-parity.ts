#!/usr/bin/env tsx

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface VercelConfig {
  framework?: string;
  buildCommand?: string;
  installCommand?: string;
}

function assertFile(path: string, message: string) {
  if (!existsSync(path)) {
    throw new Error(`${message}: ${path}`);
  }
}

function main() {
  const repoRoot = process.cwd();
  const vercelConfigPath = join(repoRoot, "vercel.json");
  const nextConfigPath = join(repoRoot, "packages/web/next.config.js");
  const webhookPath = join(repoRoot, "packages/web/src/app/api/stripe/webhook/route.ts");

  assertFile(vercelConfigPath, "Missing vercel config");
  assertFile(nextConfigPath, "Missing Next.js config");
  assertFile(webhookPath, "Missing Stripe webhook route");

  const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as VercelConfig;
  const nextConfig = readFileSync(nextConfigPath, "utf8");
  const webhookRoute = readFileSync(webhookPath, "utf8");

  if (vercelConfig.framework && vercelConfig.framework !== "nextjs") {
    throw new Error(`Unexpected Vercel framework: ${vercelConfig.framework}`);
  }

  if (vercelConfig.buildCommand && !vercelConfig.buildCommand.includes("pnpm")) {
    throw new Error(`Expected pnpm build command for monorepo, got: ${vercelConfig.buildCommand}`);
  }

  if (!nextConfig.includes("outputFileTracingExcludes") || !nextConfig.includes("./.next/lock")) {
    throw new Error(
      "next.config.js must exclude the transient .next/lock file from Vercel output tracing"
    );
  }

  if (!/export const runtime\s*=\s*["']nodejs["']/.test(webhookRoute)) {
    throw new Error(
      "Stripe webhook route must pin nodejs runtime for raw-body signature verification"
    );
  }

  console.log("✅ Vercel runtime parity checks passed");
  console.log("   - vercel.json and Next.js config are present and aligned");
  console.log("   - webhook runtime is pinned to nodejs");
}

main();
