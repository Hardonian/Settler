"use strict";
/**
 * Data Contract Manager
 *
 * Manages data contract versioning and breaking change detection
 * Part of Phase V: AIOS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractManager = void 0;
const logger_1 = require("../../utils/logger");
class ContractManager {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create new contract version
     */
    async createContractVersion(tenantId, contractName, version, schema) {
        const contract = await this.prisma.contractVersion.create({
            data: {
                tenantId,
                contractName,
                version,
                schemaDefinition: schema,
                isActive: true,
            },
        });
        (0, logger_1.logInfo)('Contract version created', { tenantId, contractName, version });
        return contract;
    }
    /**
     * Compare contract versions and detect breaking changes
     */
    async detectBreakingChanges(tenantId, contractName, oldVersion, newVersion) {
        const oldContract = await this.prisma.contractVersion.findUnique({
            where: {
                tenantId_contractName_version: {
                    tenantId,
                    contractName,
                    version: oldVersion,
                },
            },
        });
        const newContract = await this.prisma.contractVersion.findUnique({
            where: {
                tenantId_contractName_version: {
                    tenantId,
                    contractName,
                    version: newVersion,
                },
            },
        });
        if (!oldContract || !newContract) {
            throw new Error('Contract versions not found');
        }
        const oldSchema = oldContract.schemaDefinition;
        const newSchema = newContract.schemaDefinition;
        const breakingChanges = [];
        // Detect field removals
        const oldFields = Object.keys(oldSchema.properties || {});
        const newFields = Object.keys(newSchema.properties || {});
        for (const field of oldFields) {
            if (!newFields.includes(field)) {
                const fieldValue = oldSchema.properties?.[field];
                breakingChanges.push({
                    type: 'field_removed',
                    field,
                    before: fieldValue,
                    after: null,
                    severity: 'critical',
                });
            }
        }
        // Detect type changes
        for (const field of newFields) {
            if (oldFields.includes(field)) {
                const oldField = oldSchema.properties?.[field];
                const newField = newSchema.properties?.[field];
                const oldType = oldField?.type;
                const newType = newField?.type;
                if (oldType !== newType) {
                    breakingChanges.push({
                        type: 'field_type_changed',
                        field,
                        before: oldType,
                        after: newType,
                        severity: 'high',
                    });
                }
            }
        }
        // Detect new required fields
        const oldRequired = oldSchema.required || [];
        const newRequired = newSchema.required || [];
        for (const field of newRequired) {
            if (!oldRequired.includes(field)) {
                breakingChanges.push({
                    type: 'required_added',
                    field,
                    before: { required: false },
                    after: { required: true },
                    severity: 'high',
                });
            }
        }
        // Update contract with breaking changes
        await this.prisma.contractVersion.update({
            where: { id: newContract.id },
            data: {
                breakingChanges: breakingChanges,
            },
        });
        return breakingChanges;
    }
    /**
     * Generate migration guide for breaking changes
     */
    async generateMigrationGuide(tenantId, contractName, fromVersion, toVersion) {
        const breakingChanges = await this.detectBreakingChanges(tenantId, contractName, fromVersion, toVersion);
        let guide = `# Migration Guide: ${contractName} ${fromVersion} → ${toVersion}\n\n`;
        guide += `## Breaking Changes\n\n`;
        for (const change of breakingChanges) {
            guide += `### ${change.field} (${change.severity})\n\n`;
            guide += `**Type:** ${change.type}\n\n`;
            guide += `**Before:** ${JSON.stringify(change.before, null, 2)}\n\n`;
            guide += `**After:** ${JSON.stringify(change.after, null, 2)}\n\n`;
            guide += `**Mitigation:** TODO\n\n`;
        }
        // Update contract with migration guide
        await this.prisma.contractVersion.updateMany({
            where: {
                tenantId,
                contractName,
                version: toVersion,
            },
            data: {
                migrationGuide: guide,
            },
        });
        return guide;
    }
}
exports.ContractManager = ContractManager;
//# sourceMappingURL=contract-manager.js.map