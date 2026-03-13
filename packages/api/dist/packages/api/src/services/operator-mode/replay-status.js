"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperatorReplayStatus = getOperatorReplayStatus;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function getOperatorReplayStatus(runId, tenantId) {
    const candidatePaths = [
        node_path_1.default.resolve("artifacts", "replay-verification", `${runId}.json`),
        node_path_1.default.resolve("packages", "cli", "artifacts", "replay-verification", `${runId}.json`),
    ];
    const filePath = candidatePaths.find((candidate) => node_fs_1.default.existsSync(candidate));
    if (!filePath) {
        return {
            replay_status: "not_found",
            divergence: null,
            execution_time: null,
            hash_match: false,
        };
    }
    const report = JSON.parse(node_fs_1.default.readFileSync(filePath, "utf8"));
    if (report.tenant_id && tenantId && report.tenant_id !== tenantId) {
        return {
            replay_status: "not_found",
            divergence: null,
            execution_time: null,
            hash_match: false,
        };
    }
    return {
        replay_status: report.replay_status,
        divergence: report.divergence,
        execution_time: report.execution_time_ms,
        hash_match: report.hash_match,
    };
}
//# sourceMappingURL=replay-status.js.map