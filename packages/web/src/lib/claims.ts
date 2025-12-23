/**
 * Claims Validation System
 * 
 * Tracks high-stakes claims (SOC2, PCI, uptime SLA, etc.) with evidence.
 * Prevents "investor bait" claims without proof.
 */

export type ClaimStatus = 'proven' | 'planned' | 'deprecated';

export interface Claim {
  id: string;
  claim: string;
  status: ClaimStatus;
  evidenceUrl?: string;
  plannedDate?: string; // ISO date string
  notes?: string;
}

/**
 * Claims registry - all high-stakes claims must be registered here
 */
export const CLAIMS: Claim[] = [
  {
    id: 'soc2',
    claim: 'SOC 2 Type II Infrastructure Ready (Certification Planned Q3 2026)',
    status: 'planned',
    plannedDate: '2026-Q3',
    notes: 'SOC 2 Type II infrastructure ready. Certification planned Q3 2026.',
  },
  {
    id: 'pci',
    claim: 'PCI DSS Compliant',
    status: 'planned',
    plannedDate: '2025-Q3',
    notes: 'PCI compliance assessment planned',
  },
  {
    id: 'uptime-99.9',
    claim: '99.9% Uptime SLA',
    status: 'proven',
    evidenceUrl: '/trust',
    notes: 'Uptime tracked and reported on trust page',
  },
  {
    id: 'backup-rpo-5min',
    claim: '5-minute RPO (Recovery Point Objective)',
    status: 'proven',
    evidenceUrl: '/trust',
    notes: 'Backup strategy documented on trust page',
  },
  {
    id: 'backup-rto-1hr',
    claim: '1-hour RTO (Recovery Time Objective)',
    status: 'proven',
    evidenceUrl: '/trust',
    notes: 'Recovery objectives documented on trust page',
  },
  {
    id: 'data-durability-11nines',
    claim: '99.999999999% (11 nines) Data Durability',
    status: 'proven',
    evidenceUrl: '/trust',
    notes: 'Data durability strategy uses multi-region replication',
  },
];

/**
 * Get claim by ID
 */
export function getClaim(id: string): Claim | undefined {
  return CLAIMS.find((c) => c.id === id);
}

/**
 * Get all proven claims
 */
export function getProvenClaims(): Claim[] {
  return CLAIMS.filter((c) => c.status === 'proven');
}

/**
 * Get all planned claims
 */
export function getPlannedClaims(): Claim[] {
  return CLAIMS.filter((c) => c.status === 'planned');
}

/**
 * Check if a claim text matches any registered claim
 */
export function findClaimByText(text: string): Claim | undefined {
  const normalizedText = text.toLowerCase().trim();
  return CLAIMS.find((claim) => {
    const normalizedClaim = claim.claim.toLowerCase().trim();
    return normalizedText.includes(normalizedClaim) || normalizedClaim.includes(normalizedText);
  });
}

/**
 * Validate that a claim text is registered and has proper status
 */
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
  
  if (claim.status === 'planned') {
    return {
      isValid: true,
      claim,
      warning: `Planned claim: "${claim.claim}" (planned for ${claim.plannedDate || 'TBD'})`,
    };
  }
  
  if (claim.status === 'deprecated') {
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
