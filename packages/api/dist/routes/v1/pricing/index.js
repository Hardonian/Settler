"use strict";
/**
 * Pricing API Routes
 *
 * Part of Section 9: Pricing Intelligence
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const simulator_1 = __importDefault(require("./simulator"));
const router = (0, express_1.Router)();
router.use('/simulator', simulator_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map