"use strict";
/**
 * User Routes
 * User-specific endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboarding_progress_1 = __importDefault(require("./onboarding-progress"));
const router = (0, express_1.Router)();
router.use("/onboarding-progress", onboarding_progress_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map