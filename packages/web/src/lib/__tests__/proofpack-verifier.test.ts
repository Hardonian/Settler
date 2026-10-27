import { canonicalJsonBrowser, sha256HexBrowser, verifyProofpackJson } from "../proofpack-verifier";
import { getAllChangelogPosts, getChangelogPost } from "../changelog";
import { renderInlineMarkdown } from "@/components/content/MdxPlainRenderer";

describe("proofpack-verifier & changelog surfaces", () => {
  it("verifies Settler canonical trace proofpacks", async () => {
    const stateHash = "a".repeat(64);
    const payload = {
      state_hash: `sha256:${stateHash}`,
      trace: [{ step: 1, stateHash }],
    };
    const outcome = await verifyProofpackJson(JSON.stringify(payload));
    expect(outcome.valid).toBe(true);
    expect(outcome.format).toBe("canonical_trace");
    expect(outcome.leavesCount).toBe(1);
  });

  it("verifies DemoProofpack (settler.demo-proofpack/1.0.0) and detects tampering", async () => {
    const payload = {
      schemaVersion: "settler.demo-proofpack/1.0.0",
      runId: "run_123",
      inputHashes: { bank: "b", processor: "a" },
      run: {
        results: [{ decision: "exact" }, { decision: "tolerance" }],
      },
    };
    const commitment = await sha256HexBrowser(canonicalJsonBrowser(payload));
    const proofpack = {
      payload,
      integrity: { algorithm: "sha256", commitment },
      operationalMetadata: { generatedAt: "2026-10-26T00:00:00Z" },
    };

    const validOutcome = await verifyProofpackJson(JSON.stringify(proofpack));
    expect(validOutcome.valid).toBe(true);
    expect(validOutcome.format).toBe("demo_proofpack");
    expect(validOutcome.leavesCount).toBe(2);

    const tampered = JSON.parse(JSON.stringify(proofpack));
    tampered.payload.runId = "run_tampered";
    const invalidOutcome = await verifyProofpackJson(JSON.stringify(tampered));
    expect(invalidOutcome.valid).toBe(false);
    expect(invalidOutcome.format).toBe("demo_proofpack");
  });

  it("verifies SOX 404 Executive Audit Dossier proofpacks (both 0x digest and Merkle leaf bundles)", async () => {
    const leaf1 = await sha256HexBrowser("dossier-1:SOX-404-FIN-01:VERIFIED_EFFECTIVE:0x123");
    const leaf2 = await sha256HexBrowser("dossier-1:SOX-404-FIN-02:VERIFIED_EFFECTIVE:0x456");
    const declaredMerkleRoot = await sha256HexBrowser(`${leaf1}:${leaf2}`);

    const dossierWithLeaves = {
      dossierId: "dossier-soc1-2026-10-q4",
      period: "2026-10",
      declaredMerkleRoot,
      leaves: [{ leafHash: leaf1 }, { leafHash: leaf2 }],
      cryptographicProofs: {
        smtEpochRoot: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        sha256Digest: "0x2c624232cdd221771294dfbb310aca000a0df6ac9b66b82a19f8196c8a24ec08",
      },
    };

    const outcome = await verifyProofpackJson(JSON.stringify(dossierWithLeaves));
    expect(outcome.valid).toBe(true);
    expect(outcome.format).toBe("audit_dossier");
    expect(outcome.leavesCount).toBe(2);
  });

  it("verifies Frontier Proofpack and CFO ROI Executive Brief schemas", async () => {
    const frontier = {
      proofpackVersion: "1.6.0-sovereign",
      engine: "ContinuousT0Ledger",
      merkleRoot: "b".repeat(64),
      zeroFloatInvariant: true,
      payload: { a: 1, b: 2, c: 3 },
    };
    const frontierOutcome = await verifyProofpackJson(JSON.stringify(frontier));
    expect(frontierOutcome.valid).toBe(true);
    expect(frontierOutcome.format).toBe("frontier_proofpack");

    const cfoBrief = {
      proofpackId: "cfo-brief-123",
      telemetryInputs: { monthlyGmv: 25000000 },
      financialProjections: { totalRecoverableEbita: 625000 },
      cryptographicAttestation: {
        sha256Commitment: "c".repeat(64),
      },
    };
    const cfoOutcome = await verifyProofpackJson(JSON.stringify(cfoBrief));
    expect(cfoOutcome.valid).toBe(true);
    expect(cfoOutcome.format).toBe("cfo_roi_brief");
  });

  it("loads changelog posts including 2026-10-18-settler-autonomous-frontier and formats inline math", () => {
    const posts = getAllChangelogPosts();
    expect(posts.length).toBeGreaterThanOrEqual(8);
    const frontierPost = getChangelogPost("2026-10-18-settler-autonomous-frontier");
    expect(frontierPost).not.toBeNull();
    expect(frontierPost?.title).toContain("Autonomous Sovereign Frontier");

    const rendered = renderInlineMarkdown(
      "Enforces $\\sum \\text{Debits} = \\sum \\text{Credits}$ with **zero-float** `BigInt`."
    );
    expect(rendered.length).toBeGreaterThan(3);
  });
});
