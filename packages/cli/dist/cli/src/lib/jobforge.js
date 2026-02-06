"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobForgeConfig = getJobForgeConfig;
exports.requireJobForgeClient = requireJobForgeClient;
exports.parseJsonOption = parseJsonOption;
const chalk_1 = __importDefault(require("chalk"));
const sdk_ts_1 = require("@jobforge/sdk-ts");
function getJobForgeConfig() {
    return {
        enabled: ['1', 'true', 'yes'].includes((process.env.JOBFORGE_INTEGRATION_ENABLED ?? '0').toLowerCase()),
        bundleExecutionEnabled: ['1', 'true', 'yes'].includes((process.env.JOBFORGE_BUNDLE_EXECUTION_ENABLED ?? '0').toLowerCase()),
    };
}
function requireJobForgeClient() {
    const config = getJobForgeConfig();
    if (!config.enabled) {
        console.error(chalk_1.default.red('JobForge integration is disabled. Set JOBFORGE_INTEGRATION_ENABLED=1 to enable.'));
        process.exit(1);
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        console.error(chalk_1.default.red('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for JobForge operations.'));
        process.exit(1);
    }
    return new sdk_ts_1.JobForgeClient({
        supabaseUrl,
        supabaseKey,
    });
}
function parseJsonOption(value) {
    if (!value) {
        return {};
    }
    try {
        return JSON.parse(value);
    }
    catch {
        console.error(chalk_1.default.red('Invalid JSON provided. Please pass valid JSON.'));
        process.exit(1);
    }
}
//# sourceMappingURL=jobforge.js.map