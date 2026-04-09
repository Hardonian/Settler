/**
 * Canonical high-stakes claims registry for marketing and trust surfaces.
 *
 * - `proven`: machine-verifiable or audit-backed today (evidence URL required).
 * - `documented_target`: design / operational target documented but not contractually or automatically proven.
 * - `planned`: roadmap / certification in flight.
 * - `deprecated`: must not be displayed.
 */

export type ClaimStatus = "proven" | "documented_target" | "planned" | "deprecated";

export interface Claim {
  id: string;
  claim: string;
  status: ClaimStatus;
  evidenceUrl?: string;
  plannedDate?: string;
  notes?: string;
}

/**
 * All high-stakes claims must be registered here. Prefer `documented_target` over `proven`
 * unless you can point to automated verification or a signed attestation.
 */
export const CLAIMS: Claim[] = [
  {
    id: "soc2",
    claim: "SOC 2 Type II — certification program (not complete)",
    status: "planned",
    plannedDate: "2026-Q3",
    notes: "Infrastructure readiness is not the same as a completed SOC 2 Type II audit.",
  },
  {
    id: "pci",
    claim: "PCI DSS — assessment not represented as complete",
    status: "planned",
    plannedDate: "TBD",
    notes: "Card data handling posture must be validated per deployment; no blanket PCI claim.",
  },
  {
    id: "uptime-sla",
    claim: "Published uptime SLA percentage for hosted Settler",
    status: "documented_target",
    notes:
      "No default SLA-backed uptime percent is asserted in product surfaces. Customer SLAs are contractual and out of band.",
  },
  {
    id: "backup-rpo",
    claim: "Recovery Point Objective (RPO) for production data",
    status: "documented_target",
    notes:
      "RPO is deployment- and backup-configuration-dependent. Canonical operator context: repository `docs/launch/canonical-go-live-path.md` and your backup provider contract.",
  },
  {
    id: "backup-rto",
    claim: "Recovery Time Objective (RTO) for production restore",
    status: "documented_target",
    notes:
      "RTO depends on infra, data size, and runbook execution. Canonical operator context: repository `docs/launch/canonical-go-live-path.md`.",
  },
  {
    id: "data-durability",
    claim: "11-nines object durability (cloud storage marketing figure)",
    status: "deprecated",
    notes:
      "Do not echo vendor durability marketing as a Settler-proven claim; durability is provider- and configuration-specific.",
  },
];

export function getClaim(id: string): Claim | undefined {
  return CLAIMS.find((c) => c.id === id);
}

export function getProvenClaims(): Claim[] {
  return CLAIMS.filter((c) => c.status === "proven");
}

export function getDocumentedTargetClaims(): Claim[] {
  return CLAIMS.filter((c) => c.status === "documented_target");
}

export function getPlannedClaims(): Claim[] {
  return CLAIMS.filter((c) => c.status === "planned");
}

export function findClaimByText(text: string): Claim | undefined {
  const normalizedText = text.toLowerCase().trim();
  return CLAIMS.find((claim) => {
    const normalizedClaim = claim.claim.toLowerCase().trim();
    return normalizedText.includes(normalizedClaim) || normalizedClaim.includes(normalizedText);
  });
}

export function validateClaim(text: string): {
  isValid: boolean;
  claim?: Claim;
  warning?: string;
} {
  const claim = findClaimByText(text);

  if (!claim) {
    return {
      isValid: false,
      warning: `Unregistered claim: "${text}". All high-stakes claims must be registered in lib/claims.ts`,
    };
  }

  if (claim.status === "planned") {
    return {
      isValid: true,
      claim,
      warning: `Planned claim: "${claim.claim}" (planned for ${claim.plannedDate || "TBD"})`,
    };
  }

  if (claim.status === "documented_target") {
    return {
      isValid: true,
      claim,
      warning: `Documented target (not proven SLA/attestation): "${claim.claim}"`,
    };
  }

  if (claim.status === "deprecated") {
    return {
      isValid: false,
      claim,
      warning: `Deprecated claim: "${claim.claim}" should not be displayed`,
    };
  }

  return {
    isValid: true,
    claim,
  };
}
