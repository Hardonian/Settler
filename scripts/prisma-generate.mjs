#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE || "binary",
  PRISMA_ENGINES_MIRROR: process.env.PRISMA_ENGINES_MIRROR || "",
};

const result = spawnSync("pnpm", ["exec", "prisma", "generate"], {
  env,
  stdio: "pipe",
  encoding: "utf8",
  shell: true,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status === 0) {
  process.exit(0);
}

const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
const isPrismaBinary403 =
  combined.includes("https://binaries.prisma.sh") && combined.includes("403 Forbidden");
const isChecksumFailure = combined.includes("Failed to fetch sha256 checksum");
const isEngineFailure = combined.includes("Failed to fetch the engine file");

if (isPrismaBinary403) {
  const category = isChecksumFailure
    ? "prisma_engine_checksum_forbidden"
    : isEngineFailure
      ? "prisma_engine_download_forbidden"
      : "prisma_engine_fetch_forbidden";
  const detail = isChecksumFailure
    ? "checksum endpoint returned HTTP 403 from binaries.prisma.sh"
    : isEngineFailure
      ? "engine artifact endpoint returned HTTP 403 from binaries.prisma.sh"
      : "engine fetch endpoint returned HTTP 403 from binaries.prisma.sh";

  console.error(
    `[prisma-generate] deterministic failure classification: ${JSON.stringify(
      {
        status: "blocked_external",
        category,
        detail,
        suggestion:
          "Provide a reachable PRISMA_ENGINES_MIRROR or allow binaries.prisma.sh for this runtime.",
      },
      null,
      2
    )}`
  );
}

process.exit(result.status ?? 1);
