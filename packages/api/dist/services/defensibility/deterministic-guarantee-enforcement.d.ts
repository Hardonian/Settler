/**
 * Deterministic Guarantee Enforcement Service
 *
 * Explicitly enforces and tracks deterministic behavior guarantees.
 * This creates trust and defensibility by guaranteeing same inputs produce same outputs.
 *
 * PHASE: Enforcement & Trust Moat Reinforcement
 *
 * Based on narrative compression requirements:
 * - Guarantee: Same inputs produce same outputs, always
 * - Track deterministic behavior violations
 * - Provide deterministic guarantees in SLAs
 * - Demonstrate deterministic behavior to customers
 */
export interface DeterministicRun {
    reconciliationRunId: string;
    tenantId: string;
    inputsHash: string;
    outputsHash: string;
    deterministic: boolean;
    verifiedAt: Date;
}
export interface DeterministicGuarantee {
    tier: string;
    guaranteed: boolean;
    slaPercentage?: number;
    violationPenalty?: string;
}
/**
 * Deterministic Guarantee Enforcement Service
 *
 * Enforces and tracks deterministic behavior guarantees
 */
export declare class DeterministicGuaranteeEnforcementService {
    /**
     * Get deterministic guarantee for tier
     */
    getDeterministicGuarantee(tierId: string): DeterministicGuarantee;
    /**
     * Verify deterministic behavior
     *
     * Runs same reconciliation twice and verifies outputs match
     */
    verifyDeterministicBehavior(reconciliationRunId: string, tenantId: string): Promise<{
        deterministic: boolean;
        inputsHash: string;
        outputsHash: string;
    }>;
    /**
     * Check deterministic guarantee compliance
     *
     * Verifies that deterministic guarantees are being met for a tenant
     */
    checkDeterministicCompliance(tenantId: string, startDate: Date, endDate: Date): Promise<{
        totalRuns: number;
        deterministicRuns: number;
        nonDeterministicRuns: number;
        compliancePercentage: number;
        guaranteeMet: boolean;
    }>;
    /**
     * Hash inputs for deterministic verification
     */
    private hashInputs;
    /**
     * Hash outputs for deterministic verification
     */
    private hashOutputs;
    /**
     * Simple hash function (in production, use crypto.subtle)
     */
    private simpleHash;
}
export declare const deterministicGuaranteeEnforcementService: DeterministicGuaranteeEnforcementService;
//# sourceMappingURL=deterministic-guarantee-enforcement.d.ts.map