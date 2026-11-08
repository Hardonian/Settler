import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  SparseMerkleTree,
  verifySmtProof,
  verifyCompactSmtProof,
  compressSmtProof,
  expandSmtProof,
  getEmptyHashes,
  SMT_DEPTH,
} from "./compact-smt.js";

describe("Compact Sparse Merkle Tree (CSMT)", () => {
  it("initializes empty tree with deterministic 256-bit root", () => {
    const tree = new SparseMerkleTree();
    expect(tree.rootHex()).toHaveLength(64);
    const emptyHashes = getEmptyHashes();
    expect(emptyHashes).toHaveLength(SMT_DEPTH + 1);
    expect(tree.rootHex()).toBe(emptyHashes[0]!.toString("hex"));
  });

  it("proves and verifies standard inclusion proofs", () => {
    const tree = new SparseMerkleTree();
    const key = crypto.createHash("sha256").update("tx:settlement:001").digest();
    const value = crypto.createHash("sha256").update("amount:5000:usd").digest();

    tree.update(key, value);
    const proof = tree.proveInclusion(key);
    expect(proof).not.toBeNull();
    expect(proof!.isInclusion).toBe(true);
    expect(proof!.siblingsHex).toHaveLength(SMT_DEPTH);

    const verification = verifySmtProof(proof!);
    expect(verification.valid).toBe(true);
    expect(verification.computedRoot).toBe(tree.rootHex());
  });

  it("compresses SMT inclusion proof by >90% and verifies roundtrip equivalence", () => {
    const tree = new SparseMerkleTree();
    const key1 = crypto.createHash("sha256").update("tx:settlement:001").digest();
    const val1 = crypto.createHash("sha256").update("amount:5000:usd").digest();
    const key2 = crypto.createHash("sha256").update("tx:settlement:002").digest();
    const val2 = crypto.createHash("sha256").update("amount:7500:usd").digest();

    tree.update(key1, val1);
    tree.update(key2, val2);

    const fullProof = tree.proveInclusion(key1)!;
    const compactProof = tree.proveCompactInclusion(key1)!;

    // Verify compression: 256 siblings compressed down to <= 16 siblings
    expect(compactProof.nonEmptySiblingsHex.length).toBeLessThanOrEqual(16);
    expect(compactProof.presenceBitmapHex).toHaveLength(64);

    // Verify expansion matches original 256-level proof exactly
    const expanded = expandSmtProof(compactProof);
    expect(expanded).toEqual(fullProof);

    // Verify direct verification of compact proof
    const verification = verifyCompactSmtProof(compactProof);
    expect(verification.valid).toBe(true);
    expect(verification.computedRoot).toBe(tree.rootHex());
  });

  it("proves and verifies compact non-inclusion proofs for absent keys", () => {
    const tree = new SparseMerkleTree();
    const keyPresent = crypto.createHash("sha256").update("tx:settlement:001").digest();
    const valPresent = crypto.createHash("sha256").update("amount:5000:usd").digest();
    tree.update(keyPresent, valPresent);

    const keyAbsent = crypto.createHash("sha256").update("tx:unsettled:ghost").digest();
    const compactNonProof = tree.proveCompactNonInclusion(keyAbsent);
    expect(compactNonProof).not.toBeNull();
    expect(compactNonProof!.isInclusion).toBe(false);
    expect(compactNonProof!.valueHex).toBeUndefined();

    const verification = verifyCompactSmtProof(compactNonProof!);
    expect(verification.valid).toBe(true);
    expect(verification.isNonInclusion).toBe(true);
    expect(verification.computedRoot).toBe(tree.rootHex());
  });

  it("detects tampering in compact proof value or presence bitmap", () => {
    const tree = new SparseMerkleTree();
    const key = crypto.createHash("sha256").update("tx:fraud:check").digest();
    const val = crypto.createHash("sha256").update("balance:ok").digest();
    tree.update(key, val);

    const compact = tree.proveCompactInclusion(key)!;

    // Tamper with the value
    const tampered = {
      ...compact,
      valueHex: crypto.createHash("sha256").update("balance:tampered").digest("hex"),
    };

    const result = verifyCompactSmtProof(tampered);
    expect(result.valid).toBe(false);
  });
});
