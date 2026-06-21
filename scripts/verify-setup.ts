#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import * as dotenv from "dotenv";
import nodeContract from "./node-version-contract.cjs";

type Severity = "error" | "warning";

type Finding = {
  severity: Severity;
  area: string;
  message: string;
  action?: string;
};

function loadEnvFiles(): string[] {
  const loaded: string[] = [];
  const candidates = [
    ".env",
    ".env.local",
    ".env.production",
    path.join("packages", "web", ".env.local"),
    path.join("packages", "api", ".env.local"),
  ];

  for (const file of candidates) {
    const full = path.join(process.cwd(), file);
    if (fs.existsSync(full)) {
      dotenv.config({ path: full, override: false });
      loaded.push(file);
    }
  }

  return loaded;
}

function isEnabled(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());
}

function hasValue(name: string): boolean {
  return Boolean(process.env[name] && process.env[name]?.trim());
}

function validateToolchain(findings: Finding[]): void {
  try {
    nodeContract.assertSupportedNodeVersion("verify:setup");
  } catch (error) {
    const { requiredVersion } = nodeContract.formatNodeRequirement();
    const requiredMajor = requiredVersion.split(".")[0] ?? "22";
    findings.push({
      severity: "error",
      area: "toolchain",
      message: error instanceof Error ? error.message : String(error),
      action: `Switch to the repo Node ${requiredMajor} toolchain before onboarding or verification.`,
    });
  }
}

function addRequired(
  findings: Finding[],
  names: string[],
  area: string,
  action?: string,
  when = true
): void {
  if (!when) return;
  for (const name of names) {
    if (!hasValue(name)) {
      findings.push({
        severity: "error",
        area,
        message: `Missing required env: ${name}`,
        action,
      });
    }
  }
}

function validateCore(findings: Finding[]): void {
  const mode = (process.env.NODE_ENV ?? "development").toLowerCase();
  const prodLike = mode === "production" || process.env.DEPLOYMENT_ENV === "production";

  addRequired(
    findings,
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    "web",
    "Bootstrap local env with cp .env.local.example .env.local, then set Supabase browser keys."
  );
  addRequired(
    findings,
    ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
    "api/auth",
    "Set Supabase server keys in .env.local before running API or production checks."
  );

  const hasAnyDb =
    hasValue("DATABASE_URL") || hasValue("SUPABASE_DATABASE_URL") || hasValue("DIRECT_URL");
  if (!hasAnyDb) {
    findings.push({
      severity: "error",
      area: "database",
      message: "Missing database DSN. Set DATABASE_URL, SUPABASE_DATABASE_URL, or DIRECT_URL.",
      action:
        "Use .env.local.example as baseline and configure DATABASE_URL before smoke/build verification.",
    });
  }

  if (prodLike) {
    addRequired(
      findings,
      ["SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "ENCRYPTION_KEY"],
      "api/security",
      "Populate production secrets before deploy."
    );

    if (hasValue("JWT_SECRET") && (process.env.JWT_SECRET ?? "").length < 32) {
      findings.push({
        severity: "error",
        area: "api/security",
        message: "JWT_SECRET must be at least 32 characters in production.",
      });
    }

    if (hasValue("ENCRYPTION_KEY")) {
      const len = (process.env.ENCRYPTION_KEY ?? "").length;
      if (len !== 32) {
        findings.push({
          severity: "error",
          area: "api/security",
          message: `ENCRYPTION_KEY must be exactly 32 characters in production (found ${len}).`,
        });
      }
    }
  }
}

async function validateKernel(findings: Finding[]): Promise<void> {
  const kernelEnabled =
    isEnabled(process.env.SETTLER_KERNEL_ENABLED) &&
    isEnabled(process.env.SETTLER_KERNEL_CANONICALIZE) &&
    !isEnabled(process.env.SETTLER_DISABLE_KERNEL);
  if (!kernelEnabled) {
    findings.push({
      severity: "warning",
      area: "kernel",
      message: "Kernel not enabled (running with TS fallback path).",
    });
    return;
  }

  const health = checkKernelHandshake();
  if (!health.healthy) {
    findings.push({
      severity: "error",
      area: "kernel",
      message: `Kernel startup handshake failed (${health.reason}).`,
      action:
        "Set SETTLER_DISABLE_KERNEL=1 for immediate rollback or repair kernel binary/runtime.",
    });
    return;
  }

  findings.push({
    severity: "warning",
    area: "kernel",
    message: `Kernel healthy via ${health.runnerMode} (${health.kernelVersion}, ${health.protocolVersion}).`,
  });
}

function checkKernelHandshake(): {
  healthy: boolean;
  reason: string;
  runnerMode: "binary" | "cargo-run" | "fallback-ts";
  protocolVersion: string;
  kernelVersion: string;
} {
  const configuredBin = process.env.SETTLER_KERNEL_BIN?.trim();
  const operation = JSON.stringify({ operation: "handshake", payload: {} });

  if (configuredBin) {
    if (!fs.existsSync(configuredBin)) {
      return {
        healthy: false,
        reason: "binary_missing",
        runnerMode: "fallback-ts",
        protocolVersion: "unknown",
        kernelVersion: "unknown",
      };
    }

    const result = spawnSync(configuredBin, [], {
      input: operation,
      encoding: "utf8",
      timeout: 1500,
    });
    return parseHandshake(result.stdout ?? "", result.status ?? 1, "binary");
  }

  const allowCargo =
    isEnabled(process.env.SETTLER_KERNEL_ALLOW_CARGO) ||
    isEnabled(process.env.SETTLER_KERNEL_DEV_FALLBACK);
  if (!allowCargo) {
    return {
      healthy: false,
      reason: "no_runner_available",
      runnerMode: "fallback-ts",
      protocolVersion: "unknown",
      kernelVersion: "unknown",
    };
  }

  const result = spawnSync("cargo", ["run", "--quiet", "-p", "settler-kernel-cli"], {
    input: operation,
    encoding: "utf8",
    timeout: 1500,
  });

  return parseHandshake(result.stdout ?? "", result.status ?? 1, "cargo-run");
}

function parseHandshake(
  stdout: string,
  status: number,
  runnerMode: "binary" | "cargo-run"
): {
  healthy: boolean;
  reason: string;
  runnerMode: "binary" | "cargo-run" | "fallback-ts";
  protocolVersion: string;
  kernelVersion: string;
} {
  if (status !== 0) {
    return {
      healthy: false,
      reason: "non_zero_exit",
      runnerMode,
      protocolVersion: "unknown",
      kernelVersion: "unknown",
    };
  }

  try {
    const parsed = JSON.parse(stdout) as {
      ok?: boolean;
      protocol_version?: string;
      kernel_version?: string;
      operation?: string;
    };
    if (!parsed.ok || parsed.operation !== "handshake") {
      return {
        healthy: false,
        reason: "invalid_envelope",
        runnerMode,
        protocolVersion: "unknown",
        kernelVersion: "unknown",
      };
    }

    return {
      healthy: true,
      reason: "healthy",
      runnerMode,
      protocolVersion: parsed.protocol_version ?? "unknown",
      kernelVersion: parsed.kernel_version ?? "unknown",
    };
  } catch {
    return {
      healthy: false,
      reason: "malformed_json",
      runnerMode,
      protocolVersion: "unknown",
      kernelVersion: "unknown",
    };
  }
}

function validateBilling(findings: Finding[]): void {
  const billingEnabled = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  ].some((key) => hasValue(key));

  if (!billingEnabled) {
    findings.push({
      severity: "warning",
      area: "billing",
      message: "Billing not enabled (Stripe env not set).",
    });
    return;
  }

  addRequired(
    findings,
    ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    "billing",
    "Set Stripe server keys for billing endpoints and webhook verification."
  );
}

function validateEnterprise(findings: Finding[]): void {
  const jobforgeEnabled = isEnabled(process.env.JOBFORGE_INTEGRATION_ENABLED);
  const bundleEnabled = isEnabled(process.env.JOBFORGE_BUNDLE_EXECUTION_ENABLED);

  if (!jobforgeEnabled && !bundleEnabled) {
    findings.push({
      severity: "warning",
      area: "enterprise",
      message: "Enterprise integrations not enabled.",
    });
    return;
  }

  if (bundleEnabled && !jobforgeEnabled) {
    findings.push({
      severity: "error",
      area: "enterprise",
      message: "JOBFORGE_BUNDLE_EXECUTION_ENABLED=1 requires JOBFORGE_INTEGRATION_ENABLED=1.",
      action: "Enable integration flag or disable bundle execution.",
    });
  }

  addRequired(
    findings,
    ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    "enterprise",
    "JobForge integration requires privileged Supabase access."
  );

  if (!hasValue("CREDENTIAL_ENCRYPTION_KEY") && !hasValue("SUPABASE_VAULT_KEY")) {
    findings.push({
      severity: "error",
      area: "enterprise",
      message:
        "Missing credential encryption material: set CREDENTIAL_ENCRYPTION_KEY or SUPABASE_VAULT_KEY.",
      action: "Configure one credential encryption key before enabling enterprise integrations.",
    });
  }
}

function printFindings(findings: Finding[], loadedEnvFiles: string[]): void {
  const grouped = new Map<string, Finding[]>();
  for (const finding of findings) {
    if (!grouped.has(finding.area)) grouped.set(finding.area, []);
    grouped.get(finding.area)?.push(finding);
  }

  console.log("🩺 Settler setup verification");
  const loadedSummary = loadedEnvFiles.length > 0 ? loadedEnvFiles.join(", ") : "none";
  console.log(`Loaded env files: ${loadedSummary}`);
  console.log(
    "Tip: local runs only see env exported in this shell, loaded from local .env files, or injected by doppler run."
  );
  for (const [area, items] of grouped.entries()) {
    console.log(`\n[${area}]`);
    for (const item of items) {
      const icon = item.severity === "error" ? "❌" : "⚠️";
      console.log(`${icon} ${item.message}`);
      if (item.action) {
        console.log(`   ↳ ${item.action}`);
      }
    }
  }
}

async function main(): Promise<void> {
  const loadedEnvFiles = loadEnvFiles();

  const findings: Finding[] = [];
  validateToolchain(findings);
  validateCore(findings);
  validateBilling(findings);
  validateEnterprise(findings);
  await validateKernel(findings);
  printFindings(findings, loadedEnvFiles);

  const hasErrors = findings.some((finding) => finding.severity === "error");
  if (hasErrors) {
    console.error("\n❌ setup verification failed");
    process.exit(1);
  }

  console.log("\n✅ setup verification passed (no critical blockers)");
}

main().catch((error: unknown) => {
  console.error("❌ verify:setup crashed", error);
  process.exit(1);
});
