import { describe, it, expect } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import {
  computePolicyHash,
  signThresholdManifest,
  verifyThresholdAttestation,
  type ThresholdAttestationPolicy,
} from "./threshold-attestation.js";

describe("Threshold Attestation Service", () => {
  // Generate 3 test Ed25519 keypairs
  const controllerKey = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const cfoKey = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const auditorKey = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const policy: ThresholdAttestationPolicy = {
    policyId: "pol_month_end_close_v1",
    tenantId: "tenant_acme_corp",
    requiredQuorum: 2,
    mandatoryRoles: ["CONTROLLER"],
    authorizedSigners: [
      {
        keyId: "key_controller_01",
        publicKeyPem: controllerKey.publicKey,
        role: "CONTROLLER",
        identity: "sarah.controller@acme.com",
      },
      {
        keyId: "key_cfo_01",
        publicKeyPem: cfoKey.publicKey,
        role: "CFO",
        identity: "marcus.cfo@acme.com",
      },
      {
        keyId: "key_auditor_01",
        publicKeyPem: auditorKey.publicKey,
        role: "AUDITOR",
        identity: "lead.partner@big4audit.com",
      },
    ],
  };

  const targetRoot = "48c781e97fd3557ea0722087a34c3098579d9bef56d76f41c5f96c46199631b5";

  it("computes deterministic policy hash", () => {
    const hash1 = computePolicyHash(policy);
    const hash2 = computePolicyHash(policy);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("satisfies policy when quorum and mandatory role are met", () => {
    const sig1 = signThresholdManifest(targetRoot, controllerKey.privateKey, "key_controller_01");
    const sig2 = signThresholdManifest(targetRoot, auditorKey.privateKey, "key_auditor_01");

    const result = verifyThresholdAttestation(targetRoot, policy, [sig1, sig2]);

    expect(result.valid).toBe(true);
    expect(result.quorumMet).toBe(true);
    expect(result.mandatoryRolesSatisfied).toBe(true);
    expect(result.validSignaturesCount).toBe(2);
    expect(result.verifiedRoles).toEqual(["AUDITOR", "CONTROLLER"]);
    expect(result.missingMandatoryRoles).toHaveLength(0);
  });

  it("fails when quorum is met but mandatory role is missing", () => {
    // CFO + Auditor = 2 signers (quorum met), but CONTROLLER is missing
    const sig1 = signThresholdManifest(targetRoot, cfoKey.privateKey, "key_cfo_01");
    const sig2 = signThresholdManifest(targetRoot, auditorKey.privateKey, "key_auditor_01");

    const result = verifyThresholdAttestation(targetRoot, policy, [sig1, sig2]);

    expect(result.quorumMet).toBe(true);
    expect(result.mandatoryRolesSatisfied).toBe(false);
    expect(result.missingMandatoryRoles).toContain("CONTROLLER");
    expect(result.valid).toBe(false);
  });

  it("fails when quorum is not met", () => {
    // Only Controller signed = 1 of 2
    const sig1 = signThresholdManifest(targetRoot, controllerKey.privateKey, "key_controller_01");

    const result = verifyThresholdAttestation(targetRoot, policy, [sig1]);

    expect(result.quorumMet).toBe(false);
    expect(result.validSignaturesCount).toBe(1);
    expect(result.valid).toBe(false);
  });

  it("ignores duplicate signatures from the same keyId", () => {
    const sig1 = signThresholdManifest(targetRoot, controllerKey.privateKey, "key_controller_01");

    // Sending same signature twice shouldn't count as 2 signers
    const result = verifyThresholdAttestation(targetRoot, policy, [sig1, sig1]);

    expect(result.validSignaturesCount).toBe(1);
    expect(result.quorumMet).toBe(false);
    expect(result.valid).toBe(false);
  });

  it("rejects unauthorized keys and corrupted signatures", () => {
    const rogueKey = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const rogueSig = signThresholdManifest(targetRoot, rogueKey.privateKey, "key_rogue");
    const fakeSig = {
      keyId: "key_controller_01",
      signatureHex: "deadbeef0011223344",
      signedAtIso: new Date().toISOString(),
    };

    const result = verifyThresholdAttestation(targetRoot, policy, [rogueSig, fakeSig]);

    expect(result.validSignaturesCount).toBe(0);
    expect(result.valid).toBe(false);
  });
});
