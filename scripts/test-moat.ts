#!/usr/bin/env tsx
import assert from "node:assert/strict";
import { compilePolicy } from "../policies/compile";
import { getPolicy } from "../policies";
import { buildHashChain, sha256, stableStringify } from "../evidence/hash";
import { executeWithPolicy } from "../runner/executeWithPolicy";

async function main() {
  const policy = getPolicy("demo.strict");
  const ctx = {
    tenantId: "t1",
    actorRole: "operator",
    actorScopes: ["reconcile:run"],
    replayCalls: 0,
  };
  const firstPlan = compilePolicy(policy, ctx);
  const secondPlan = compilePolicy(policy, ctx);
  assert.equal(firstPlan.policyHash, secondPlan.policyHash, "compilePolicy must be deterministic");

  const hashA = sha256(stableStringify({ a: 1, b: 2 }));
  const hashB = sha256(stableStringify({ b: 2, a: 1 }));
  assert.equal(hashA, hashB, "stable hashing must be key-order independent");
  assert.equal(buildHashChain(["a", "b", "c"]).length, 3, "hash chain should contain all parts");

  await assert.rejects(
    executeWithPolicy({
      tenantId: "",
      actor: { role: "operator", scopes: ["reconcile:run"] },
      policyId: "demo.strict",
      runId: "bad",
      outputDir: "examples/demo-output/tmp",
      replayCalls: 0,
      inputs: {},
      config: {},
      engineVersion: "v1",
      engineFn: async () => ({}),
    }),
    /at least 1 character/
  );

  await assert.rejects(
    executeWithPolicy({
      tenantId: "tenant",
      actor: { role: "operator", scopes: ["reconcile:run"] },
      policyId: "demo.strict",
      runId: "budget-fail",
      outputDir: "examples/demo-output/tmp",
      replayCalls: 0,
      inputs: {},
      config: {},
      engineVersion: "v1",
      engineFn: async ({ meter }: { meter: any }) => {
        meter.addCompute(2000);
        return {};
      },
    }),
    /Budget exceeded/
  );

  console.log("moat tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
