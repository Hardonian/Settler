"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendProblemJson = sendProblemJson;
function sendProblemJson(req, res, options) {
    const problem = {
        type: options.type ?? `https://docs.settler.dev/problems/${options.code.toLowerCase()}`,
        title: options.title,
        status: options.status,
        detail: options.detail,
        code: options.code,
        timestamp: new Date().toISOString(),
        trace_id: req.traceId,
        execution_id: req.executionId,
        tenant_id: req.tenantId,
    };
    if (options.extra) {
        Object.assign(problem, options.extra);
    }
    res.setHeader("Content-Type", "application/problem+json");
    res.status(options.status).json(problem);
}
//# sourceMappingURL=problem-json.js.map