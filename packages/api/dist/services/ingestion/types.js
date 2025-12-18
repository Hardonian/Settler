"use strict";
/**
 * Ingestion Pipeline Types
 * Core types for the universal ingestion system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizedTransactionSchema = void 0;
const zod_1 = require("zod");
/**
 * Normalized transaction schema (internal format)
 */
exports.NormalizedTransactionSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3).default("USD"),
    date: zod_1.z.coerce.date(),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    externalId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
//# sourceMappingURL=types.js.map