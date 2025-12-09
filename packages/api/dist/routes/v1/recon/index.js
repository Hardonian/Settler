"use strict";
/**
 * Recon Core API Routes
 *
 * Unified API for Recon Core Engine
 * Part of Phase I: Recon Core Foundation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobs_1 = __importDefault(require("./jobs"));
const results_1 = __importDefault(require("./results"));
const router = (0, express_1.Router)();
// Mount sub-routers
router.use('/jobs', jobs_1.default);
router.use('/jobs/:jobId/results', results_1.default);
router.use('/results', results_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map