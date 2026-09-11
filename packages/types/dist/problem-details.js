"use strict";
/**
 * RFC 7807 / RFC 9457 Problem Details for HTTP APIs
 *
 * Standardized, machine-readable error envelope for Astra and Settler API surfaces.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProblemDetails = createProblemDetails;
function createProblemDetails(options) {
    return {
        type: options.type ?? `https://api.settler.io/errors/${options.code.toLowerCase()}`,
        title: options.title,
        status: options.status,
        detail: options.detail,
        instance: options.instance ?? `/v1/requests/${options.traceId ?? "anon"}`,
        code: options.code,
        tenantId: options.tenantId,
        traceId: options.traceId ?? `trace_${Date.now()}`,
        timestamp: new Date().toISOString(),
        invalidParams: options.invalidParams,
        merkleRoot: options.merkleRoot,
    };
}
//# sourceMappingURL=problem-details.js.map