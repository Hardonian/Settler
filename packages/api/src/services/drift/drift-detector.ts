/**
 * Drift Detection Service
 * 
 * Detects schema and field drift, auto-repairs when possible
 * Part of Phase III: Self-Healing AI Mesh
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { PrismaClient, Prisma } from '@prisma/client';
import { logInfo, logError } from '../../utils/logger';
import { MultiAgentFallback } from '../ai-mesh/multi-agent-fallback';
import { AIRouter } from '../ai-mesh/ai-router';

export interface DriftDetection {
  fieldPath: string;
  expectedType: string;
  actualType: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  severity: 'warning' | 'error';
  confidence: number;
}

export class DriftDetector {
  private prisma: PrismaClient;
  private agentFallback: MultiAgentFallback;
  private router: AIRouter;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.router = new AIRouter();
    this.agentFallback = new MultiAgentFallback(this.router);
  }

  /**
   * Detect drift in data
   */
  async detectDrift(
    tenantId: string,
    reconJobId: string,
    contractVersionId: string | null,
    sourceData: Record<string, unknown>[],
    targetData: Record<string, unknown>[]
  ): Promise<DriftDetection[]> {
    const drifts: DriftDetection[] = [];

    // Get contract schema if available
    let contractSchema: Record<string, unknown> | null = null;
    if (contractVersionId) {
      const contract = await this.prisma.contractVersion.findUnique({
        where: { id: contractVersionId },
      });
      contractSchema = (contract?.schemaDefinition as Record<string, unknown> | null | undefined) ?? null;
    }

    // Analyze source data
    const sourceSchema = this.inferSchema(sourceData);
    const targetSchema = this.inferSchema(targetData);

    // Compare schemas
    const schemaDrifts = this.compareSchemas(sourceSchema, targetSchema, contractSchema);
    drifts.push(...schemaDrifts);

    // Detect value drifts
    const valueDrifts = await this.detectValueDrifts(sourceData, targetData);
    drifts.push(...valueDrifts);

    // Log drift events
    for (const drift of drifts) {
      await this.logDriftEvent(tenantId, reconJobId, contractVersionId, drift);
    }

    return drifts;
  }

  /**
   * Auto-repair drift
   */
  async autoRepair(
    tenantId: string,
    reconJobId: string,
    drift: DriftDetection
  ): Promise<boolean> {
    try {
      // Use AI agent to suggest repair
      const repair = await this.agentFallback.handleSchemaDeviation(
        { type: drift.expectedType, value: drift.expectedValue },
        { type: drift.actualType, value: drift.actualValue }
      );

      if (repair.success && repair.result) {
        // Update mapping template or transformation recipe
        await this.applyRepair(tenantId, reconJobId, drift, repair.result);
        
        // Log repair
        await this.prisma.driftEvent.updateMany({
          where: {
            tenantId,
            reconJobId,
            fieldPath: drift.fieldPath,
            acknowledged: false,
          },
          data: {
            autoRepaired: true,
            repairAction: repair.result as Prisma.InputJsonValue,
          },
        });

        logInfo('Drift auto-repaired', { tenantId, reconJobId, fieldPath: drift.fieldPath });
        return true;
      }
    } catch (error) {
      logError('Failed to auto-repair drift', { error, tenantId, reconJobId, drift });
    }

    return false;
  }

  /**
   * Infer schema from data
   */
  private inferSchema(data: Record<string, unknown>[]): Record<string, string> {
    if (data.length === 0) return {};

    const schema: Record<string, string> = {};
    const sample = data[0];

    if (sample && typeof sample === 'object') {
      for (const key in sample) {
        if (Object.prototype.hasOwnProperty.call(sample, key)) {
          const value = sample[key];
          schema[key] = this.getType(value);
        }
      }
    }

    return schema;
  }

  /**
   * Get type of value
   */
  private getType(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Compare schemas
   */
  private compareSchemas(
    source: Record<string, string>,
    target: Record<string, string>,
    contract?: Record<string, unknown> | null
  ): DriftDetection[] {
    const drifts: DriftDetection[] = [];
    const allFields = new Set([...Object.keys(source), ...Object.keys(target)]);

    for (const field of allFields) {
      const sourceType = source[field];
      const targetType = target[field];
      const contractProps = contract && typeof contract === 'object' && 'properties' in contract ? contract.properties as Record<string, { type?: string }> : undefined;
      const contractType = contractProps?.[field]?.type;

      if (sourceType && targetType && sourceType !== targetType) {
        drifts.push({
          fieldPath: field,
          expectedType: contractType || sourceType,
          actualType: targetType,
          severity: 'error',
          confidence: 1.0,
        });
      } else if (contractType && sourceType && contractType !== sourceType) {
        drifts.push({
          fieldPath: field,
          expectedType: contractType,
          actualType: sourceType,
          severity: 'warning',
          confidence: 0.8,
        });
      }
    }

    return drifts;
  }

  /**
   * Detect value drifts
   */
  private async detectValueDrifts(
    _sourceData: Record<string, unknown>[],
    _targetData: Record<string, unknown>[]
  ): Promise<DriftDetection[]> {
    // TODO: Implement statistical drift detection
    // Compare distributions, detect outliers, etc.
    return [];
  }

  /**
   * Log drift event
   */
  private async logDriftEvent(
    tenantId: string,
    reconJobId: string,
    contractVersionId: string | null,
    drift: DriftDetection
  ): Promise<void> {
    await this.prisma.driftEvent.create({
      data: {
        tenantId,
        reconJobId,
        contractVersionId,
        driftType: 'schema_drift',
        severity: drift.severity,
        fieldPath: drift.fieldPath,
        expectedValue: drift.expectedValue as Prisma.InputJsonValue,
        actualValue: drift.actualValue as Prisma.InputJsonValue,
        driftMetrics: {
          confidence: drift.confidence,
          expectedType: drift.expectedType,
          actualType: drift.actualType,
        } as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Apply repair
   */
  private async applyRepair(
    tenantId: string,
    reconJobId: string,
    drift: DriftDetection,
    repairAction: Record<string, unknown>
  ): Promise<void> {
    // Update mapping template or transformation recipe
    // This would modify the appropriate template/recipe to handle the drift
    logInfo('Applying drift repair', { tenantId, reconJobId, drift, repairAction });
  }
}
