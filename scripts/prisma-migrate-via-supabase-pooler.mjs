#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;

function normalizeSecret(value) {
  return String(value ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

export function buildSessionPoolerUrl({ credentialSource, poolerMetadata, projectRef }) {
  if (!PROJECT_REF_PATTERN.test(projectRef)) throw new Error("Invalid Supabase project ref");

  const source = new URL(normalizeSecret(credentialSource));
  const pooler = new URL(normalizeSecret(poolerMetadata));
  const allowedSourceHosts = new Set([`db.${projectRef}.supabase.co`, pooler.hostname]);

  if (!/^postgres(?:ql)?:$/.test(source.protocol) || !allowedSourceHosts.has(source.hostname)) {
    throw new Error("DATABASE_URL must belong to the linked Supabase project");
  }
  if (!source.password) throw new Error("DATABASE_URL must contain a database password");
  if (
    !/^postgres(?:ql)?:$/.test(pooler.protocol) ||
    !pooler.hostname.endsWith(".pooler.supabase.com") ||
    pooler.port !== "5432" ||
    decodeURIComponent(pooler.username) !== `postgres.${projectRef}`
  ) {
    throw new Error("Linked Supabase metadata is not an IPv4 session-pooler URL");
  }

  pooler.password = decodeURIComponent(source.password);
  pooler.searchParams.set("sslmode", "require");
  pooler.searchParams.set("sslaccept", "accept_invalid_certs");
  return pooler.toString();
}

function runPrisma(args, databaseUrl) {
  const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: databaseUrl },
    maxBuffer: 20 * 1024 * 1024,
    shell: process.platform === "win32",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Prisma ${args.join(" ")} failed`);
}

function loadPoolerUrl() {
  const projectRef = readFileSync(path.resolve("supabase/.temp/project-ref"), "utf8").trim();
  const poolerMetadata = readFileSync(path.resolve("supabase/.temp/pooler-url"), "utf8").trim();
  return buildSessionPoolerUrl({
    credentialSource: process.env.DATABASE_CREDENTIAL_SOURCE,
    poolerMetadata,
    projectRef,
  });
}

function main() {
  const command = process.argv[2];
  const databaseUrl = loadPoolerUrl();

  if (command === "check") {
    console.log("Supabase IPv4 session-pooler credentials are structurally valid");
    return;
  }
  if (command !== "deploy") {
    throw new Error("Usage: prisma-migrate-via-supabase-pooler.mjs <check|deploy>");
  }

  runPrisma(["validate"], databaseUrl);
  runPrisma(["migrate", "deploy"], databaseUrl);
  runPrisma(["migrate", "status"], databaseUrl);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
