import { Command } from "commander";
import path from "node:path";
import { stableHash } from "@settler/protocol";
import { MAX_VERIFICATION_JSON_BYTES, readLimitedJsonSync } from "../lib/safety";
import { verifyLedgerEntry } from "../lib/execution-ledger";
import { verifyProofpack, type Proofpack } from "../lib/proof-engine";
import { createCliLogger, resolveJsonFallbackFromEnv } from "../lib/cli-logger";

export const verifyCommand = new Command("verify")
  .description("Verify a Reconciliation Proof Capsule (RPC) against source data")
  .argument("<capsule-path>", "Path to Reconciliation Proof Capsule (RPC) JSON")
  .option("-i, --input <path>", "Path to input data JSON (tenantId + source/target transactions)")
  .option("-r, --rules <path>", "Path to reconciliation rules JSON")
  .option("-o, --output <path>", "Path to reconciliation matches/output JSON")
  .action(async (capsulePath, options) => {
    const json = resolveJsonFallbackFromEnv();
    const logger = createCliLogger({ isJSONFallback: json });

    try {
      const maybeExecutionReport = await verifyLedgerEntry(capsulePath);
      if (maybeExecutionReport) {
        logger.section("Execution ledger receipt");
        logger.detail(`execution_id=${maybeExecutionReport.executionId}`);
        logger.log(
          maybeExecutionReport.receiptIntegrity ? "success" : "error",
          `Receipt integrity: ${maybeExecutionReport.receiptIntegrity ? "ok" : "fail"}`
        );
        logger.log(
          maybeExecutionReport.hashMatches ? "success" : "error",
          `Hash correctness: ${maybeExecutionReport.hashMatches ? "ok" : "fail"}`
        );
        logger.log(
          maybeExecutionReport.replayCompatible ? "success" : "error",
          `Replay compatibility: ${maybeExecutionReport.replayCompatible ? "ok" : "fail"}`
        );
        if (
          !maybeExecutionReport.receiptIntegrity ||
          !maybeExecutionReport.hashMatches ||
          !maybeExecutionReport.replayCompatible
        ) {
          process.exit(1);
        }
        return;
      }

      logger.section("Reconciliation proof");

      const fullCapsulePath = path.resolve(process.cwd(), capsulePath);
      const capsule = readLimitedJsonSync(
        fullCapsulePath,
        "capsule",
        MAX_VERIFICATION_JSON_BYTES
      ) as Record<string, unknown>;

      if (capsule.schemaVersion === "2026-03-13" && typeof capsule.execution_id === "string") {
        const result = verifyProofpack(capsule as unknown as Proofpack);
        if (!result.valid) {
          logger.error(`INVALID: ${result.reason}`);
          process.exit(1);
        }
        logger.success("VALID");
        logger.rawLine(`execution_id=${capsule.execution_id}`);
        return;
      }

      const requiredFields = [
        "capsuleVersion",
        "jobId",
        "inputHash",
        "ruleHash",
        "outputHash",
        "versionHash",
        "createdAt",
      ];
      const missingFields = requiredFields.filter((f) => !capsule[f]);

      if (missingFields.length > 0) {
        logger.error(`Invalid capsule format. Missing fields: ${missingFields.join(", ")}`);
        process.exit(1);
      }

      logger.detail(`Capsule Version: ${String(capsule.capsuleVersion)}`);
      logger.detail(`Job ID: ${String(capsule.jobId)}`);
      logger.detail(`Created At: ${String(capsule.createdAt)}`);
      logger.detail(`Version Hash: ${String(capsule.versionHash)}`);

      logger.section("Verification status");

      let allMatch = true;

      if (options.input) {
        const inputData = readLimitedJsonSync(
          path.resolve(process.cwd(), options.input),
          "input",
          MAX_VERIFICATION_JSON_BYTES
        );
        const computedInputHash = stableHash(inputData);
        if (computedInputHash === capsule.inputHash) {
          logger.success("Input hash: MATCH");
        } else {
          logger.error("Input hash: MISMATCH");
          logger.detail(`  Expected: ${String(capsule.inputHash)}`);
          logger.detail(`  Computed: ${computedInputHash}`);
          allMatch = false;
        }
      } else {
        logger.warning("Input hash: SKIPPED (no input data provided)");
      }

      if (options.rules) {
        const rulesData = readLimitedJsonSync(
          path.resolve(process.cwd(), options.rules),
          "rules",
          MAX_VERIFICATION_JSON_BYTES
        );
        const computedRuleHash = stableHash(rulesData);
        if (computedRuleHash === capsule.ruleHash) {
          logger.success("Rule hash: MATCH");
        } else {
          logger.error("Rule hash: MISMATCH");
          logger.detail(`  Expected: ${String(capsule.ruleHash)}`);
          logger.detail(`  Computed: ${computedRuleHash}`);
          allMatch = false;
        }
      } else {
        logger.warning("Rule hash: SKIPPED (no rules data provided)");
      }

      if (options.output) {
        const outputData = readLimitedJsonSync(
          path.resolve(process.cwd(), options.output),
          "output",
          MAX_VERIFICATION_JSON_BYTES
        );
        const computedOutputHash = stableHash(outputData);
        if (computedOutputHash === capsule.outputHash) {
          logger.success("Output hash: MATCH");
        } else {
          logger.error("Output hash: MISMATCH");
          logger.detail(`  Expected: ${String(capsule.outputHash)}`);
          logger.detail(`  Computed: ${computedOutputHash}`);
          allMatch = false;
        }
      } else {
        logger.warning("Output hash: SKIPPED (no output data provided)");
      }

      if (!allMatch) {
        logger.error("Proof verification failed");
        process.exit(1);
      } else {
        logger.success("Proof verification successful");
        logger.detail("The provided data matches the cryptographic signatures in this capsule.");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      logger.error(`Verification error: ${message}`);
      process.exit(1);
    }
  });
