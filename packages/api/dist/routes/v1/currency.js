"use strict";
/**
 * Currency/FX API Routes
 *
 * REST API endpoints for multi-currency operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../../middleware/validation");
const authorization_1 = require("../../middleware/authorization");
const Permissions_1 = require("../../infrastructure/security/Permissions");
const FXService_1 = require("../../application/currency/FXService");
const api_response_1 = require("../../utils/api-response");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
const fxService = new FXService_1.FXService();
// Validation schemas
const convertCurrencySchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.object({
            value: zod_1.z.number(),
            currency: zod_1.z.string(),
        }),
        toCurrency: zod_1.z.string(),
        date: zod_1.z.string().datetime().optional(),
    }),
});
const getFXRateSchema = zod_1.z.object({
    query: zod_1.z.object({
        fromCurrency: zod_1.z.string(),
        toCurrency: zod_1.z.string(),
        date: zod_1.z.string().datetime().optional(),
    }),
});
/**
 * POST /api/v1/currency/convert
 * Convert amount to base currency
 */
router.post('/convert', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(convertCurrencySchema), async (req, res) => {
    try {
        const { amount, toCurrency, date } = req.body;
        const tenantId = req.tenantId;
        const moneyAmount = {
            value: typeof amount === 'number' ? amount : parseFloat(String(amount)),
            currency: toCurrency,
        };
        const converted = await fxService.convertToBaseCurrency(tenantId, moneyAmount, toCurrency, date ? new Date(date) : undefined);
        if (!converted) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'FX rate not available for currency pair');
        }
        (0, api_response_1.sendSuccess)(res, { original: amount, converted });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to convert currency', 500);
    }
});
/**
 * GET /api/v1/currency/fx-rate
 * Get FX rate for currency pair
 */
router.get('/fx-rate', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, validation_1.validateRequest)(getFXRateSchema), async (req, res) => {
    try {
        const { fromCurrency, toCurrency, date } = req.query;
        const tenantId = req.tenantId;
        const rate = await fxService.getFXRate(tenantId, fromCurrency, toCurrency, date ? new Date(date) : undefined);
        if (rate === null) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'FX rate not available for currency pair');
        }
        (0, api_response_1.sendSuccess)(res, {
            fromCurrency,
            toCurrency,
            rate,
            date: date || new Date().toISOString(),
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get FX rate', 500);
    }
});
/**
 * GET /api/v1/currency/base-currency
 * Get base currency for tenant
 */
router.get('/base-currency', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const baseCurrency = await fxService.getBaseCurrency(tenantId);
        (0, api_response_1.sendSuccess)(res, { baseCurrency });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get base currency', 500);
    }
});
/**
 * GET /api/v1/currency/fx-rates
 * Get all FX rates for tenant
 */
router.get('/fx-rates', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const date = req.query.date ? new Date(req.query.date) : undefined;
        const rates = await fxService.getFXRates(tenantId, date);
        (0, api_response_1.sendSuccess)(res, { rates });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get FX rates', 500);
    }
});
exports.default = router;
//# sourceMappingURL=currency.js.map