"use strict";
/**
 * Governance Layer
 *
 * Version pinning, immutability zones, migration guardrails, audit trails
 * Part 11: Resilience & Zero-Fault Hardening
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceLayer = void 0;
const logger_1 = require("../../utils/logger");
class GovernanceLayer {
    _prisma;
    rules = new Map();
    evolutionEvents = [];
    constructor(prisma) {
        this._prisma = prisma;
        // Reserved for future database operations
        void this._prisma;
    }
    /**
     * Pin version
     */
    async pinVersion(resourceType, resourceId, version) {
        const rule = {
            type: 'version_pinning',
            resourceType,
            resourceId,
            rule: { version },
        };
        this.addRule(resourceId, rule);
        (0, logger_1.logInfo)('Version pinned', { resourceType, resourceId, version });
    }
    /**
     * Create immutability zone
     */
    async createImmutabilityZone(resourceType, resourceId) {
        const rule = {
            type: 'immutability',
            resourceType,
            resourceId,
            rule: { immutable: true },
        };
        this.addRule(resourceId, rule);
        (0, logger_1.logInfo)('Immutability zone created', { resourceType, resourceId });
    }
    /**
     * Add migration guardrail
     */
    async addMigrationGuardrail(resourceType, resourceId, guardrail) {
        const rule = {
            type: 'migration_guardrail',
            resourceType,
            resourceId,
            rule: guardrail,
        };
        this.addRule(resourceId, rule);
        (0, logger_1.logInfo)('Migration guardrail added', { resourceType, resourceId });
    }
    /**
     * Check if change is allowed
     */
    async isChangeAllowed(_resourceType, resourceId, proposedChange) {
        const rules = this.getRules(resourceId);
        // Check immutability
        const immutabilityRule = rules.find(r => r.type === 'immutability');
        if (immutabilityRule) {
            return {
                allowed: false,
                reason: 'Resource is in immutability zone',
            };
        }
        // Check version pinning
        const versionRule = rules.find(r => r.type === 'version_pinning');
        if (versionRule && proposedChange.version !== versionRule.rule.version) {
            return {
                allowed: false,
                reason: `Version is pinned to ${versionRule.rule.version}`,
            };
        }
        // Check migration guardrails
        const migrationRule = rules.find(r => r.type === 'migration_guardrail');
        if (migrationRule) {
            const guardrail = migrationRule.rule;
            if (proposedChange.breakingChange && !guardrail.allowBreakingChanges) {
                return {
                    allowed: false,
                    reason: 'Breaking changes not allowed',
                };
            }
            if (guardrail.requireApproval) {
                // TODO: Check for approval
                return {
                    allowed: false,
                    reason: 'Approval required',
                };
            }
            const maxVersionJump = typeof guardrail.maxVersionJump === 'number' ? guardrail.maxVersionJump : 0;
            const versionJump = typeof proposedChange.versionJump === 'number' ? proposedChange.versionJump : 0;
            if (versionJump > maxVersionJump) {
                return {
                    allowed: false,
                    reason: `Version jump exceeds maximum (${maxVersionJump})`,
                };
            }
        }
        return { allowed: true };
    }
    /**
     * Log evolution event
     */
    async logEvolutionEvent(event) {
        this.evolutionEvents.push(event);
        (0, logger_1.logInfo)('Evolution event logged', { event });
    }
    /**
     * Get evolution history
     */
    getEvolutionHistory(resourceId) {
        return this.evolutionEvents.filter(e => e.resourceId === resourceId);
    }
    /**
     * Add rule
     */
    addRule(resourceId, rule) {
        if (!this.rules.has(resourceId)) {
            this.rules.set(resourceId, []);
        }
        this.rules.get(resourceId).push(rule);
    }
    /**
     * Get rules
     */
    getRules(resourceId) {
        return this.rules.get(resourceId) || [];
    }
}
exports.GovernanceLayer = GovernanceLayer;
//# sourceMappingURL=governance-layer.js.map