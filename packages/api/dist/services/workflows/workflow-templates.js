"use strict";
/**
 * Workflow Templates
 *
 * Pre-built templates for common reconciliation workflows.
 * These create workflow lock-in by embedding Settler into operational processes.
 *
 * PHASE: Workflow Lock-In Reinforcement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowTemplateService = exports.WorkflowTemplateService = void 0;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const workflow_entanglement_1 = require("../workflow-entanglement");
/**
 * Pre-built workflow templates
 */
const BUILT_IN_TEMPLATES = [
    {
        id: "stripe-shopify-recon",
        name: "Stripe → Shopify Reconciliation",
        description: "Automatically reconcile Stripe payments with Shopify orders. Runs daily and exports to QuickBooks.",
        category: "ecommerce",
        sourceAdapter: "stripe",
        targetAdapter: "shopify",
        scheduleCron: "0 2 * * *", // Daily at 2 AM
        matchingRules: [
            {
                field: "amount",
                type: "exact",
                config: { tolerance: 0.01 },
            },
            {
                field: "date",
                type: "range",
                config: { windowDays: 7 },
            },
            {
                field: "description",
                type: "fuzzy",
                config: { threshold: 0.8 },
            },
        ],
        validationRules: [
            {
                type: "currency_match",
                config: {},
            },
            {
                type: "amount_positive",
                config: {},
            },
        ],
        webhookConfig: {
            url: "${WEBHOOK_URL}",
            events: ["reconciliation.completed", "reconciliation.failed"],
        },
        externalReferences: [
            {
                system: "quickbooks",
                referenceType: "finance",
            },
            {
                system: "accounting",
                referenceType: "audit",
            },
        ],
    },
    {
        id: "stripe-quickbooks-recon",
        name: "Stripe → QuickBooks Reconciliation",
        description: "Reconcile Stripe transactions with QuickBooks accounting entries. Creates audit trail for compliance.",
        category: "accounting",
        sourceAdapter: "stripe",
        targetAdapter: "quickbooks",
        scheduleCron: "0 3 * * *", // Daily at 3 AM
        matchingRules: [
            {
                field: "amount",
                type: "exact",
                config: { tolerance: 0.01 },
            },
            {
                field: "date",
                type: "range",
                config: { windowDays: 3 },
            },
            {
                field: "external_id",
                type: "exact",
                config: {},
            },
        ],
        validationRules: [
            {
                type: "currency_match",
                config: {},
            },
            {
                type: "audit_required",
                config: {},
            },
        ],
        externalReferences: [
            {
                system: "quickbooks",
                referenceType: "finance",
            },
            {
                system: "compliance",
                referenceType: "compliance",
            },
        ],
    },
    {
        id: "saas-subscription-recon",
        name: "SaaS Subscription Reconciliation",
        description: "Reconcile subscription billing (Chargebee/Recurly) with payment processor (Stripe). Tracks MRR and churn.",
        category: "saas",
        sourceAdapter: "chargebee",
        targetAdapter: "stripe",
        scheduleCron: "0 1 * * *", // Daily at 1 AM
        matchingRules: [
            {
                field: "amount",
                type: "exact",
                config: { tolerance: 0.01 },
            },
            {
                field: "date",
                type: "range",
                config: { windowDays: 1 },
            },
            {
                field: "external_id",
                type: "exact",
                config: {},
            },
        ],
        validationRules: [
            {
                type: "subscription_match",
                config: {},
            },
        ],
        externalReferences: [
            {
                system: "analytics",
                referenceType: "report",
            },
            {
                system: "finance",
                referenceType: "finance",
            },
        ],
    },
];
/**
 * Workflow Template Service
 */
class WorkflowTemplateService {
    /**
     * Get all available templates
     */
    async getTemplates(category) {
        let templates = BUILT_IN_TEMPLATES;
        if (category) {
            templates = templates.filter((t) => t.category === category);
        }
        // Also get custom templates from database
        try {
            const customTemplates = await (0, db_1.query)(`SELECT 
          id, name, description, category, source_adapter, target_adapter,
          schedule_cron, matching_rules, validation_rules, webhook_config,
          external_references
        FROM recon_templates
        WHERE is_public = true
        ${category ? "AND category = $1" : ""}
        ORDER BY usage_count DESC`, category ? [category] : []);
            const custom = (customTemplates || []).map((t) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                sourceAdapter: t.source_adapter,
                targetAdapter: t.target_adapter,
                scheduleCron: t.schedule_cron,
                matchingRules: t.matching_rules || [],
                validationRules: t.validation_rules || [],
                webhookConfig: t.webhook_config,
                externalReferences: t.external_references || [],
            }));
            templates = [...templates, ...custom];
        }
        catch (error) {
            (0, logger_1.logError)("Failed to load custom templates", error);
        }
        return templates;
    }
    /**
     * Create reconciliation job from template
     */
    async createJobFromTemplate(templateId, tenantId, userId, configOverrides) {
        try {
            // Get template
            const template = BUILT_IN_TEMPLATES.find((t) => t.id === templateId) ||
                (await this.getTemplateFromDB(templateId));
            if (!template) {
                throw new Error(`Template ${templateId} not found`);
            }
            // Merge with overrides
            const finalTemplate = { ...template, ...configOverrides };
            // Create reconciliation job
            const jobId = await (0, db_1.query)(`INSERT INTO recon_jobs (
          id, tenant_id, user_id, name, description, template_id,
          source_adapter, source_config_encrypted, target_adapter,
          target_config_encrypted, validation_rules, recon_strategy,
          schedule_cron, schedule_timezone, status, metadata, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', $14, NOW(), NOW()
        ) RETURNING id`, [
                tenantId,
                userId,
                finalTemplate.name,
                finalTemplate.description,
                templateId,
                finalTemplate.sourceAdapter,
                "{}", // Encrypted config (placeholder)
                finalTemplate.targetAdapter,
                "{}", // Encrypted config (placeholder)
                JSON.stringify(finalTemplate.validationRules),
                "deterministic",
                finalTemplate.scheduleCron,
                "UTC",
                JSON.stringify({ templateId }),
            ]);
            const jobIdValue = jobId[0].id;
            // Register workflow references
            for (const ref of finalTemplate.externalReferences || []) {
                await workflow_entanglement_1.workflowEntanglementService.registerExternalReference(tenantId, "recon_job", jobIdValue, ref.system, `template-${templateId}`, ref.referenceType);
            }
            // Create webhook if configured
            if (finalTemplate.webhookConfig) {
                // Webhook creation would go here
                (0, logger_1.logInfo)("Webhook configured for template job", {
                    jobId: jobIdValue,
                    templateId,
                });
            }
            (0, logger_1.logInfo)("Created job from template", {
                jobId: jobIdValue,
                templateId,
                tenantId,
            });
            return jobIdValue;
        }
        catch (error) {
            (0, logger_1.logError)("Failed to create job from template", error, {
                templateId,
                tenantId,
            });
            throw error;
        }
    }
    /**
     * Get template from database
     */
    async getTemplateFromDB(templateId) {
        try {
            const result = await (0, db_1.query)(`SELECT 
          id, name, description, category, source_adapter_type, target_adapter_type,
          schedule_cron, matching_rules, validation_rules, metadata
        FROM recon_templates
        WHERE id = $1`, [templateId]);
            if (result.length === 0) {
                return null;
            }
            const t = result[0];
            return {
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                sourceAdapter: t.source_adapter_type,
                targetAdapter: t.target_adapter_type,
                scheduleCron: t.schedule_cron || "0 0 * * *",
                matchingRules: t.matching_rules || [],
                validationRules: t.validation_rules || [],
                externalReferences: [],
            };
        }
        catch (error) {
            (0, logger_1.logError)("Failed to get template from DB", error, { templateId });
            return null;
        }
    }
}
exports.WorkflowTemplateService = WorkflowTemplateService;
exports.workflowTemplateService = new WorkflowTemplateService();
//# sourceMappingURL=workflow-templates.js.map