#!/usr/bin/env node
import { compilePromptToSpec } from "./reconciliation-control-plane.mjs";

const prompt = "Match payouts within 2 cents tolerance and auto-approve recurring vendor matches.";
const memory = [
  {
    id: "mem-org-a",
    org_id: "org-a",
    workspace_id: "ws-a",
    memory_type: "tolerance_preference",
    content_json: { type: "absolute", value: 0.02 },
  },
  {
    id: "mem-org-b",
    org_id: "org-b",
    workspace_id: "ws-b",
    memory_type: "tolerance_preference",
    content_json: { type: "percentage", value: 0.005 },
  },
];

const orgA = compilePromptToSpec({ prompt, orgId: "org-a", workspaceId: "ws-a", memory });
const orgB = compilePromptToSpec({ prompt, orgId: "org-b", workspaceId: "ws-b", memory });

if (orgA.memory_influence.includes("mem-org-b") || orgB.memory_influence.includes("mem-org-a")) {
  console.error("❌ Tenant isolation failed: cross-org memory influence detected");
  process.exit(1);
}

console.log("✅ Tenant isolation verified");
console.log(`org-a memory influence=${orgA.memory_influence.join(",")}`);
console.log(`org-b memory influence=${orgB.memory_influence.join(",")}`);
