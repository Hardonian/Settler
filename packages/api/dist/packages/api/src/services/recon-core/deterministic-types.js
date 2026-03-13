"use strict";
/**
 * Deterministic Execution Types
 *
 * Ensures reconciliation runs are fully reproducible by capturing:
 * - Input hash fingerprinting
 * - Rule version locking
 * - Execution provenance
 * - Deterministic ordering
 *
 * Part of Phase II: Determinism Hardening
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunSnapshotBuilder = void 0;
exports.generateInputHash = generateInputHash;
exports.generateDataHash = generateDataHash;
exports.generateRuleChecksum = generateRuleChecksum;
exports.generateProvenanceHash = generateProvenanceHash;
exports.sortRecordsDeterministically = sortRecordsDeterministically;
exports.sortMatchesDeterministically = sortMatchesDeterministically;
const crypto_1 = require("crypto");
// ============================================================================
// HASH UTILITIES
// ============================================================================
/**
 * Generate deterministic hash for input data
 */
function generateInputHash(data) {
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    return (0, crypto_1.createHash)("sha256").update(canonical).digest("hex");
}
/**
 * Generate hash for array of records
 */
function generateDataHash(records) {
    // Sort records by ID for deterministic ordering
    const sorted = [...records].sort((a, b) => {
        const aId = String(a.id || "");
        const bId = String(b.id || "");
        return aId.localeCompare(bId);
    });
    // Create canonical representation
    const canonical = JSON.stringify(sorted);
    return (0, crypto_1.createHash)("sha256").update(canonical).digest("hex");
}
/**
 * Generate hash for rule configuration
 */
function generateRuleChecksum(rule) {
    const canonical = JSON.stringify({
        id: rule.id,
        version: rule.version,
        config: rule.config,
    });
    return (0, crypto_1.createHash)("sha256").update(canonical).digest("hex");
}
/**
 * Generate provenance entry hash for integrity
 */
function generateProvenanceHash(entry) {
    const canonical = JSON.stringify({
        runResultId: entry.runResultId,
        sequence: entry.sequence,
        timestamp: entry.timestamp,
        operation: entry.operation,
        entityId: entry.entityId,
        details: entry.details,
    });
    return (0, crypto_1.createHash)("sha256").update(canonical).digest("hex");
}
// ============================================================================
// SNAPSHOT BUILDER
// ============================================================================
/**
 * Builder for creating immutable run snapshots
 */
class RunSnapshotBuilder {
    jobId = "";
    tenantId = "";
    jobConfig = {};
    ruleVersions = [];
    sourceData = [];
    targetData = [];
    sourceAdapterConfig = "";
    targetAdapterConfig = "";
    setJobId(jobId) {
        this.jobId = jobId;
        return this;
    }
    setTenantId(tenantId) {
        this.tenantId = tenantId;
        return this;
    }
    setJobConfig(config) {
        this.jobConfig = config;
        return this;
    }
    setRuleVersions(versions) {
        this.ruleVersions = versions;
        return this;
    }
    setSourceData(data) {
        this.sourceData = data;
        return this;
    }
    setTargetData(data) {
        this.targetData = data;
        return this;
    }
    setAdapterConfigs(source, target) {
        this.sourceAdapterConfig = source;
        this.targetAdapterConfig = target;
        return this;
    }
    build() {
        const sourceDataHash = generateDataHash(this.sourceData);
        const targetDataHash = generateDataHash(this.targetData);
        const snapshot = {
            id: `snapshot_${this.jobId}_${Date.now()}`,
            inputHash: "",
            createdAt: new Date().toISOString(),
            jobConfig: {
                jobId: this.jobId,
                tenantId: this.tenantId,
                name: this.jobConfig.name || "",
                description: this.jobConfig.description,
                reconStrategy: this.jobConfig.reconStrategy || "deterministic",
                validationRules: this.jobConfig.validationRules || [],
                mappingTemplateId: this.jobConfig.mappingTemplateId,
                mappingTemplateVersion: this.jobConfig.mappingTemplateVersion,
                transformRecipeId: this.jobConfig.transformRecipeId,
                transformRecipeVersion: this.jobConfig.transformRecipeVersion,
            },
            ruleVersions: this.ruleVersions,
            sourceDataHash,
            targetDataHash,
            adapterConfigHashes: {
                source: generateInputHash(this.sourceAdapterConfig),
                target: generateInputHash(this.targetAdapterConfig),
            },
            engineVersion: process.env.npm_package_version || "1.0.0",
            metadata: {},
        };
        // Generate overall input hash
        snapshot.inputHash = generateInputHash({
            jobConfig: snapshot.jobConfig,
            ruleVersions: snapshot.ruleVersions,
            sourceDataHash,
            targetDataHash,
            adapterConfigHashes: snapshot.adapterConfigHashes,
            engineVersion: snapshot.engineVersion,
        });
        return snapshot;
    }
}
exports.RunSnapshotBuilder = RunSnapshotBuilder;
// ============================================================================
// DETERMINISTIC ORDERING
// ============================================================================
/**
 * Sort records deterministically for reproducible processing order
 */
function sortRecordsDeterministically(records) {
    return [...records].sort((a, b) => {
        // Primary sort: by ID
        const aId = String(a.id || "");
        const bId = String(b.id || "");
        const idCompare = aId.localeCompare(bId);
        if (idCompare !== 0)
            return idCompare;
        // Secondary sort: by timestamp if available
        const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
        const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
        return aTime - bTime;
    });
}
/**
 * Sort matches deterministically for reproducible output
 */
function sortMatchesDeterministically(matches) {
    return [...matches].sort((a, b) => {
        // Primary sort: by confidence (descending)
        if (a.confidence !== b.confidence) {
            return b.confidence - a.confidence;
        }
        // Secondary sort: by source ID
        const sourceCompare = a.sourceId.localeCompare(b.sourceId);
        if (sourceCompare !== 0)
            return sourceCompare;
        // Tertiary sort: by target ID
        return a.targetId.localeCompare(b.targetId);
    });
}
//# sourceMappingURL=deterministic-types.js.map