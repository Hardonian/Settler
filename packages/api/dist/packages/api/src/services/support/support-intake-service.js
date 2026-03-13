"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitSupportIntake = submitSupportIntake;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const support_intake_contract_1 = require("./support-intake-contract");
const event_bus_1 = require("../events/event-bus");
async function submitSupportIntake(params) {
    const parsed = support_intake_contract_1.supportIntakeSubmissionSchema.parse({
        ...(typeof params.body === "object" && params.body ? params.body : {}),
        tenant_id: params.tenantId,
    });
    const submissionId = crypto_1.default.randomUUID();
    try {
        await persistSupportIntakeToAuditLog({
            userId: params.userId,
            tenantId: params.tenantId,
            path: params.path,
            submissionId,
            payload: parsed,
        });
        await event_bus_1.eventBus.emitEvent("support.issue.created", params.tenantId, {
            submissionId,
            category: parsed.category,
            runId: parsed.run_id ?? null,
            route: parsed.route ?? null,
            module: parsed.module ?? null,
        }, {
            correlationId: `support:${params.tenantId}:${submissionId}`,
            runId: parsed.run_id ?? undefined,
            executionId: parsed.run_id ?? submissionId,
            actorId: params.userId,
            source: "api.support-intake",
            severity: "info",
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to persist support intake submission", error, {
            tenantId: params.tenantId,
            userId: params.userId,
            submissionId,
        });
        throw error;
    }
    return {
        submissionId,
        tenantId: params.tenantId,
        createdAt: new Date().toISOString(),
    };
}
async function persistSupportIntakeToAuditLog(params) {
    await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, tenant_id, path, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`, [
        "support_intake_submitted",
        params.userId,
        params.tenantId,
        params.path,
        JSON.stringify({
            submission_id: params.submissionId,
            category: params.payload.category,
            run_id: params.payload.run_id ?? null,
            route: params.payload.route ?? null,
            module: params.payload.module ?? null,
            description: params.payload.description,
            contact: params.payload.contact ?? {},
        }),
    ]);
}
//# sourceMappingURL=support-intake-service.js.map