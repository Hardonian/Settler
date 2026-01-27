"use strict";
/**
 * Drift Detection Service
 *
 * Detects schema and field drift, auto-repairs when possible
 * Part of Phase III: Self-Healing AI Mesh
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriftDetector = void 0;
const logger_1 = require("../../utils/logger");
const multi_agent_fallback_1 = require("../ai-mesh/multi-agent-fallback");
const ai_router_1 = require("../ai-mesh/ai-router");
class DriftDetector {
    prisma;
    agentFallback;
    router;
    constructor(prisma) {
        this.prisma = prisma;
        this.router = new ai_router_1.AIRouter();
        this.agentFallback = new multi_agent_fallback_1.MultiAgentFallback(this.router);
    }
    /**
     * Detect drift in data
     */
    async detectDrift(tenantId, reconJobId, contractVersionId, sourceData, targetData) {
        const drifts = [];
        // Get contract schema if available
        let contractSchema = null;
        if (contractVersionId) {
            const contract = await this.prisma.contractVersion.findUnique({
                where: { id: contractVersionId },
            });
            contractSchema = contract?.schemaDefinition ?? null;
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
    async autoRepair(tenantId, reconJobId, drift) {
        try {
            // Use AI agent to suggest repair
            const repair = await this.agentFallback.handleSchemaDeviation({ type: drift.expectedType, value: drift.expectedValue }, { type: drift.actualType, value: drift.actualValue });
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
                        repairAction: repair.result,
                    },
                });
                (0, logger_1.logInfo)('Drift auto-repaired', { tenantId, reconJobId, fieldPath: drift.fieldPath });
                return true;
            }
        }
        catch (error) {
            (0, logger_1.logError)('Failed to auto-repair drift', { error, tenantId, reconJobId, drift });
        }
        return false;
    }
    /**
     * Infer schema from data
     */
    inferSchema(data) {
        if (data.length === 0)
            return {};
        const schema = {};
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
    getType(value) {
        if (value === null || value === undefined)
            return 'null';
        if (Array.isArray(value))
            return 'array';
        if (typeof value === 'object')
            return 'object';
        return typeof value;
    }
    /**
     * Compare schemas
     */
    compareSchemas(source, target, contract) {
        const drifts = [];
        const allFields = new Set([...Object.keys(source), ...Object.keys(target)]);
        for (const field of allFields) {
            const sourceType = source[field];
            const targetType = target[field];
            const contractProps = contract && typeof contract === 'object' && 'properties' in contract ? contract.properties : undefined;
            const contractType = contractProps?.[field]?.type;
            if (sourceType && targetType && sourceType !== targetType) {
                drifts.push({
                    fieldPath: field,
                    expectedType: contractType || sourceType,
                    actualType: targetType,
                    severity: 'error',
                    confidence: 1.0,
                });
            }
            else if (contractType && sourceType && contractType !== sourceType) {
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
    async detectValueDrifts(_sourceData, _targetData) {
        // TODO: Implement statistical drift detection
        // Compare distributions, detect outliers, etc.
        return [];
    }
    /**
     * Log drift event
     */
    async logDriftEvent(tenantId, reconJobId, contractVersionId, drift) {
        await this.prisma.driftEvent.create({
            data: {
                tenantId,
                reconJobId,
                contractVersionId,
                driftType: 'schema_drift',
                severity: drift.severity,
                fieldPath: drift.fieldPath,
                expectedValue: drift.expectedValue,
                actualValue: drift.actualValue,
                driftMetrics: {
                    confidence: drift.confidence,
                    expectedType: drift.expectedType,
                    actualType: drift.actualType,
                },
            },
        });
    }
    /**
     * Apply repair
     */
    async applyRepair(tenantId, reconJobId, drift, repairAction) {
        // Update mapping template or transformation recipe
        // This would modify the appropriate template/recipe to handle the drift
        (0, logger_1.logInfo)('Applying drift repair', { tenantId, reconJobId, drift, repairAction });
    }
}
exports.DriftDetector = DriftDetector;
//# sourceMappingURL=drift-detector.js.map