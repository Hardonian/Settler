"use strict";
/**
 * API v1 Routes
 * Version 1 of the Settler API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.v1Router = void 0;
const express_1 = require("express");
const realtime_1 = require("../realtime");
const reconciliation_summary_1 = require("../reconciliation-summary");
const transactions_1 = __importDefault(require("./transactions"));
const settlements_1 = __importDefault(require("./settlements"));
const fees_1 = __importDefault(require("./fees"));
const exports_1 = __importDefault(require("./exports"));
const currency_1 = __importDefault(require("./currency"));
const receive_1 = __importDefault(require("./webhooks/receive"));
const events_1 = __importDefault(require("./webhooks/events"));
const ingestion_1 = __importDefault(require("./ingestion"));
const reconciliation_1 = __importDefault(require("./reconciliation"));
const ingestion_exports_1 = __importDefault(require("./ingestion-exports"));
const operator_mode_1 = require("./operator-mode");
const operator_intelligence_1 = __importDefault(require("./operator-intelligence"));
const multi_source_reconciliation_1 = __importDefault(require("./multi-source-reconciliation"));
const approvals_1 = __importDefault(require("./approvals"));
const progress_1 = __importDefault(require("./progress"));
const notifications_1 = __importDefault(require("./notifications"));
const receipt_matching_1 = __importDefault(require("./receipt-matching"));
const bulk_operations_1 = __importDefault(require("./bulk-operations"));
const sla_1 = __importDefault(require("./sla"));
const audit_trail_1 = __importDefault(require("./audit-trail"));
const advanced_matching_rules_1 = __importDefault(require("./advanced-matching-rules"));
const custom_integrations_1 = __importDefault(require("./custom-integrations"));
const dedicated_infrastructure_1 = __importDefault(require("./dedicated-infrastructure"));
const automated_review_1 = __importDefault(require("./automated-review"));
const capabilities_1 = __importDefault(require("./capabilities"));
const support_1 = __importDefault(require("./support"));
exports.v1Router = (0, express_1.Router)();
// Mount v1 routes
exports.v1Router.use("/webhooks/receive", receive_1.default);
exports.v1Router.use("/webhooks", events_1.default); // Events discovery endpoint
exports.v1Router.use("/realtime", realtime_1.realtimeRouter);
exports.v1Router.use("/reconciliations", reconciliation_summary_1.reconciliationSummaryRouter);
// Canonical data model routes
exports.v1Router.use("/transactions", transactions_1.default);
exports.v1Router.use("/settlements", settlements_1.default);
exports.v1Router.use("/fees", fees_1.default);
exports.v1Router.use("/exports", exports_1.default);
exports.v1Router.use("/currency", currency_1.default);
// Ingestion pipeline routes
exports.v1Router.use("/ingestion", ingestion_1.default);
exports.v1Router.use("/reconciliation", reconciliation_1.default);
exports.v1Router.use("/ingestion/exports", ingestion_exports_1.default);
exports.v1Router.use("/automated-review", automated_review_1.default);
exports.v1Router.use("/support", support_1.default);
// Phase 1: Core Features
exports.v1Router.use("/multi-source-reconciliation", multi_source_reconciliation_1.default);
exports.v1Router.use("/approvals", approvals_1.default);
exports.v1Router.use("/progress", progress_1.default);
exports.v1Router.use("/notifications", notifications_1.default);
exports.v1Router.use("/audit-trail", audit_trail_1.default);
// Phase 2: Premium Features
exports.v1Router.use("/receipt-matching", receipt_matching_1.default);
exports.v1Router.use("/bulk-operations", bulk_operations_1.default);
exports.v1Router.use("/advanced-matching-rules", advanced_matching_rules_1.default);
// Currency routes already exist at /currency
// Phase 3: Enterprise Features
exports.v1Router.use("/sla", sla_1.default);
exports.v1Router.use("/custom-integrations", custom_integrations_1.default);
exports.v1Router.use("/dedicated-infrastructure", dedicated_infrastructure_1.default);
// Operator mode routes
exports.v1Router.use("/", operator_mode_1.operatorModeRouter);
exports.v1Router.use("/", operator_intelligence_1.default);
exports.v1Router.use("/", capabilities_1.default);
// Health check
exports.v1Router.get("/health", (_req, res) => {
    res.json({
        version: "1.0.0",
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});
//# sourceMappingURL=index.js.map