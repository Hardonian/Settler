/**
 * Drift Detection Service
 *
 * Detects schema and field drift, auto-repairs when possible
 * Part of Phase III: Self-Healing AI Mesh
 */
import { PrismaClient } from '@prisma/client';
export interface DriftDetection {
    fieldPath: string;
    expectedType: string;
    actualType: string;
    expectedValue?: unknown;
    actualValue?: unknown;
    severity: 'warning' | 'error';
    confidence: number;
}
export declare class DriftDetector {
    private prisma;
    private agentFallback;
    private router;
    constructor(prisma: PrismaClient);
    /**
     * Detect drift in data
     */
    detectDrift(tenantId: string, reconJobId: string, contractVersionId: string | null, sourceData: Record<string, unknown>[], targetData: Record<string, unknown>[]): Promise<DriftDetection[]>;
    /**
     * Auto-repair drift
     */
    autoRepair(tenantId: string, reconJobId: string, drift: DriftDetection): Promise<boolean>;
    /**
     * Infer schema from data
     */
    private inferSchema;
    /**
     * Get type of value
     */
    private getType;
    /**
     * Compare schemas
     */
    private compareSchemas;
    /**
     * Detect value drifts
     */
    private detectValueDrifts;
    /**
     * Log drift event
     */
    private logDriftEvent;
    /**
     * Apply repair
     */
    private applyRepair;
}
//# sourceMappingURL=drift-detector.d.ts.map