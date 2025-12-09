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
exports.v1Router = (0, express_1.Router)();
// Mount v1 routes
exports.v1Router.use('/webhooks/receive', receive_1.default);
exports.v1Router.use('/realtime', realtime_1.realtimeRouter);
exports.v1Router.use('/reconciliations', reconciliation_summary_1.reconciliationSummaryRouter);
// Canonical data model routes
exports.v1Router.use('/transactions', transactions_1.default);
exports.v1Router.use('/settlements', settlements_1.default);
exports.v1Router.use('/fees', fees_1.default);
exports.v1Router.use('/exports', exports_1.default);
exports.v1Router.use('/currency', currency_1.default);
// Health check
exports.v1Router.get('/health', (_req, res) => {
    res.json({
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});
//# sourceMappingURL=index.js.map