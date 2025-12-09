/**
 * Compliance Module - Policy Comparison
 *
 * Part of Phase IV: Vertical Modules
 */
import { PrismaClient } from '@prisma/client';
export interface PolicyDiff {
    added: string[];
    removed: string[];
    modified: Array<{
        section: string;
        before: string;
        after: string;
    }>;
    complianceScore: number;
    violations: Array<{
        section: string;
        violation: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
}
export declare class PolicyComparisonService {
    private _prisma;
    constructor(prisma: PrismaClient);
    /**
     * Compare privacy policies
     */
    comparePrivacyPolicies(tenantId: string, _policy1: string, _policy2: string): Promise<PolicyDiff>;
    /**
     * Detect privacy drift
     */
    detectPrivacyDrift(_tenantId: string, _currentPolicy: string, _baselinePolicy: string): Promise<{
        driftDetected: boolean;
        changes: string[];
        riskLevel: 'low' | 'medium' | 'high';
    }>;
    /**
     * Audit data retention compliance
     */
    auditDataRetention(_tenantId: string, _retentionPolicy: unknown, _actualData: Array<Record<string, unknown>>): Promise<{
        compliant: boolean;
        violations: Array<{
            dataType: string;
            retentionPeriod: number;
            actualAge: number;
            violation: string;
        }>;
    }>;
    /**
     * Generate DPIA (Data Protection Impact Assessment) helper
     */
    generateDPIA(_tenantId: string, _processingActivity: unknown): Promise<{
        riskAssessment: unknown;
        recommendations: string[];
        requiredSafeguards: string[];
    }>;
}
//# sourceMappingURL=policy-comparison.d.ts.map