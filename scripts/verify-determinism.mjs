#!/usr/bin/env node
import { compilePromptToSpec } from "./reconciliation-control-plane.mjs";

const prompt = "Reconcile Stripe against QuickBooks daily. Match payouts within 2 cents tolerance.";

const first = compilePromptToSpec({ prompt, orgId: "org-a", workspaceId: "ws-a" });
const second = compilePromptToSpec({ prompt, orgId: "org-a", workspaceId: "ws-a" });

if (first.spec_hash !== second.spec_hash) {
  console.error("❌ Determinism check failed: NL input produced different spec hashes");
  process.exit(1);
}

console.log("✅ Determinism verified");
console.log(`spec_hash=${first.spec_hash}`);
