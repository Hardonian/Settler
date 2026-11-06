/**
 * Multi-Party Threshold Cryptographic Attestation Service
 *
 * Implements M-of-N Ed25519 threshold attestation for ProofPackages,
 * month-end ledger locks, and compliance audit certificates.
 *
 * Requires a designated quorum of independent cryptographic signers
 * (e.g. Controller, Head of Finance, External Auditor) before a financial
 * period or evidence proofpack is considered sealed and tamper-evident.
 */

import { verify, sign, createHash } from "node:crypto";
import { canonicalSha256 } from "../canonical-json.js";

export type ThresholdRole = "CONTROLLER" | "CFO" | "AUDITOR" | "TREASURER" | "SYSTEM_OPERATOR";

export interface ThresholdSignerRole {
  keyId: string;
  publicKeyPem: string;
  role: ThresholdRole;
  identity: string;
}

export interface ThresholdAttestationPolicy {
  policyId: string;
  tenantId: string;
  requiredQuorum: number; // M of N
  mandatoryRoles?: ThresholdRole[]; // e.g. at least 1 CONTROLLER and 1 AUDITOR
  authorizedSigners: ThresholdSignerRole[];
}

export interface CollectedAttestationSignature {
  keyId: string;
  signatureHex: string;
  signedAtIso: string;
}

export interface ThresholdAttestationManifest {
  policyId: string;
  policyHash: string;
  targetManifestRoot: string;
  collectedSignaturesCount: number;
  validSignaturesCount: number;
  verifiedSigners: Array<{
    keyId: string;
    role: ThresholdRole;
    identity: string;
  }>;
  verifiedRoles: ThresholdRole[];
  quorumMet: boolean;
  mandatoryRolesSatisfied: boolean;
  missingMandatoryRoles: ThresholdRole[];
  valid: boolean;
  evaluationTimestamp: string;
}

/**
 * Compute canonical hash of threshold policy
 */
export function computePolicyHash(policy: ThresholdAttestationPolicy): string {
  const normalized = {
    policyId: policy.policyId,
    tenantId: policy.tenantId,
    requiredQuorum: policy.requiredQuorum,
    mandatoryRoles: policy.mandatoryRoles ? [...policy.mandatoryRoles].sort() : [],
    authorizedSigners: policy.authorizedSigners
      .map((s) => ({
        keyId: s.keyId,
        role: s.role,
        identity: s.identity,
        publicKeyPem: s.publicKeyPem.trim(),
      }))
      .sort((a, b) => a.keyId.localeCompare(b.keyId)),
  };
  return canonicalSha256(normalized);
}

/**
 * Create an Ed25519 signature over target manifest root
 */
export function signThresholdManifest(
  targetManifestRoot: string,
  privateKeyPem: string,
  keyId: string,
  signedAtIso?: string
): CollectedAttestationSignature {
  const timestamp = signedAtIso ?? new Date().toISOString();
  const message = Buffer.from(`${targetManifestRoot}:${timestamp}`, "utf8");
  const signatureBuffer = sign(null, message, privateKeyPem);

  return {
    keyId,
    signatureHex: signatureBuffer.toString("hex"),
    signedAtIso: timestamp,
  };
}

/**
 * Verify a threshold attestation against policy
 */
export function verifyThresholdAttestation(
  targetManifestRoot: string,
  policy: ThresholdAttestationPolicy,
  signatures: CollectedAttestationSignature[]
): ThresholdAttestationManifest {
  const policyHash = computePolicyHash(policy);
  const signerMap = new Map<string, ThresholdSignerRole>();
  policy.authorizedSigners.forEach((s) => signerMap.set(s.keyId, s));

  const verifiedSigners: ThresholdAttestationManifest["verifiedSigners"] = [];
  const verifiedRolesSet = new Set<ThresholdRole>();
  const seenKeyIds = new Set<string>();

  for (const sig of signatures) {
    // Prevent duplicate signature replay from same key
    if (seenKeyIds.has(sig.keyId)) continue;

    const authorized = signerMap.get(sig.keyId);
    if (!authorized) continue;

    try {
      const message = Buffer.from(`${targetManifestRoot}:${sig.signedAtIso}`, "utf8");
      const sigBuffer = Buffer.from(sig.signatureHex, "hex");
      const isSignatureValid = verify(null, message, authorized.publicKeyPem, sigBuffer);

      if (isSignatureValid) {
        seenKeyIds.add(sig.keyId);
        verifiedSigners.push({
          keyId: authorized.keyId,
          role: authorized.role,
          identity: authorized.identity,
        });
        verifiedRolesSet.add(authorized.role);
      }
    } catch {
      // Invalid signature encoding or key mismatch
      continue;
    }
  }

  const validSignaturesCount = verifiedSigners.length;
  const quorumMet = validSignaturesCount >= policy.requiredQuorum;

  const missingMandatoryRoles: ThresholdRole[] = [];
  if (policy.mandatoryRoles) {
    for (const mandatory of policy.mandatoryRoles) {
      if (!verifiedRolesSet.has(mandatory)) {
        missingMandatoryRoles.push(mandatory);
      }
    }
  }

  const mandatoryRolesSatisfied = missingMandatoryRoles.length === 0;
  const valid = quorumMet && mandatoryRolesSatisfied;

  return {
    policyId: policy.policyId,
    policyHash,
    targetManifestRoot,
    collectedSignaturesCount: signatures.length,
    validSignaturesCount,
    verifiedSigners,
    verifiedRoles: Array.from(verifiedRolesSet).sort(),
    quorumMet,
    mandatoryRolesSatisfied,
    missingMandatoryRoles,
    valid,
    evaluationTimestamp: new Date().toISOString(),
  };
}
