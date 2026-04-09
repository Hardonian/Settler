#!/usr/bin/env tsx

import {
  checkKernelOperationReadiness,
  getKernelStartupHealth,
  readKernelFlags,
  resolveKernelRunner,
} from "../packages/cli/src/lib/kernel-client";

const operations = ["canonicalize_hash", "proof_bundle_hash", "artifact_identity_hash"] as const;

async function main(): Promise<void> {
  const flags = readKernelFlags();
  const runner = resolveKernelRunner();

  console.log("Kernel health diagnostics");
  console.log("=========================");
  console.log(`flags.enabled=${flags.enabled}`);
  console.log(`flags.canonicalize=${flags.canonicalize}`);
  console.log(`flags.executionMode=${flags.executionMode}`);
  console.log(`flags.shadowMode=${flags.shadowMode}`);
  console.log(
    `flags.primaryAllowlist=${Array.from(flags.primaryAllowlist).join(",") || "<empty>"}`
  );
  console.log(
    `flags.disabledOperations=${Array.from(flags.disabledOperations).join(",") || "<empty>"}`
  );
  console.log(`runner.mode=${runner.mode}`);
  console.log(`runner.reason=${runner.reason ?? "<none>"}`);

  const startup = await getKernelStartupHealth();
  console.log("\nStartup health");
  console.log("------------");
  console.log(JSON.stringify(startup, null, 2));

  let failed = false;

  console.log("\nPer-operation readiness");
  console.log("-----------------------");
  for (const operation of operations) {
    const readiness = await checkKernelOperationReadiness(operation);
    console.log(`${operation}: ${JSON.stringify(readiness)}`);

    const expectedDisabled =
      !flags.enabled ||
      !flags.canonicalize ||
      flags.executionMode === "disabled" ||
      flags.disabledOperations.has(operation);

    if (!expectedDisabled && !readiness.operationReady) {
      failed = true;
    }
  }

  if (failed) {
    console.error("\n❌ Kernel expected to be active but one or more operations are not ready.");
    process.exit(1);
  }

  console.log("\n✅ Kernel health diagnostics completed.");
}

main().catch((error) => {
  console.error("\n❌ Kernel health diagnostics failed.");
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
