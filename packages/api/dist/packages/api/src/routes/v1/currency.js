"use strict";
/**
 * Currency Conversion API Routes
 * Handles currency conversion endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const currency_conversion_1 = require("../../services/currency-conversion");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/currency/rates
 * Get exchange rate
 */
router.get("/rates", async (req, res) => {
    try {
        const { fromCurrency, toCurrency, date } = req.query;
        if (!fromCurrency || !toCurrency) {
            return res.status(400).json({
                error: "Bad Request",
                message: "fromCurrency and toCurrency are required",
                traceId: req.traceId,
            });
        }
        const rateDate = date ? new Date(date) : new Date();
        if (Number.isNaN(rateDate.getTime())) {
            return res.status(400).json({
                error: "Bad Request",
                message: "date must be a valid ISO-8601 date string",
                traceId: req.traceId,
            });
        }
        const rate = await (0, currency_conversion_1.getExchangeRate)(fromCurrency, toCurrency, rateDate);
        if (!rate) {
            return res.status(404).json({
                error: "Not Found",
                message: "Exchange rate not found",
                traceId: req.traceId,
            });
        }
        return res.json({
            fromCurrency,
            toCurrency,
            rate,
            date: rateDate.toISOString().split("T")[0],
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get exchange rate", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get exchange rate",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/currency/rates
 * Add exchange rate
 */
router.post("/rates", async (req, res) => {
    try {
        const { fromCurrency, toCurrency, rate, date, source } = req.body;
        if (!fromCurrency || !toCurrency || rate === undefined) {
            return res.status(400).json({
                error: "Bad Request",
                message: "fromCurrency, toCurrency, and rate are required",
                traceId: req.traceId,
            });
        }
        if (typeof rate !== "number" || !Number.isFinite(rate)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "rate must be a finite number",
                traceId: req.traceId,
            });
        }
        const rateDate = date ? new Date(date) : new Date();
        if (Number.isNaN(rateDate.getTime())) {
            return res.status(400).json({
                error: "Bad Request",
                message: "date must be a valid ISO-8601 date string",
                traceId: req.traceId,
            });
        }
        const rateId = await (0, currency_conversion_1.addExchangeRate)(fromCurrency, toCurrency, rate, rateDate, source || "manual");
        (0, logger_1.logInfo)("Exchange rate added", {
            rateId,
            fromCurrency,
            toCurrency,
            rate,
            traceId: req.traceId,
        });
        return res.status(201).json({
            id: rateId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to add exchange rate", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to add exchange rate",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/currency/convert
 * Convert currency
 */
router.post("/convert", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { amount, fromCurrency, toCurrency, date, reconciliationRunId, transactionId } = req.body;
        if (amount === undefined || amount === null || !fromCurrency || !toCurrency) {
            return res.status(400).json({
                error: "Bad Request",
                message: "amount, fromCurrency, and toCurrency are required",
                traceId: req.traceId,
            });
        }
        if (typeof amount !== "number" || !Number.isFinite(amount)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "amount must be a finite number",
                traceId: req.traceId,
            });
        }
        const conversionDate = date ? new Date(date) : new Date();
        if (Number.isNaN(conversionDate.getTime())) {
            return res.status(400).json({
                error: "Bad Request",
                message: "date must be a valid ISO-8601 date string",
                traceId: req.traceId,
            });
        }
        const result = await (0, currency_conversion_1.convertCurrency)(tenantId, amount, fromCurrency, toCurrency, conversionDate, {
            reconciliationRunId,
            transactionId,
        });
        return res.json({
            ...result,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to convert currency", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: error.message || "Failed to convert currency",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=currency.js.map