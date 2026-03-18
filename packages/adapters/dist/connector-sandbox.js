"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeConnectorSandboxed = executeConnectorSandboxed;
const connector_driver_1 = require("./connector-driver");
function withTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new connector_driver_1.ConnectorError(`Connector timed out after ${timeoutMs}ms`, "CONNECTOR_TIMEOUT", ""));
        }, timeoutMs);
        promise
            .then((value) => {
            clearTimeout(timer);
            resolve(value);
        })
            .catch((error) => {
            clearTimeout(timer);
            reject(error);
        });
    });
}
function normalizeSyncOptions(options) {
    return {
        ...(options.since ? { since: new Date(options.since.toISOString()) } : {}),
        ...(options.until ? { until: new Date(options.until.toISOString()) } : {}),
        ...(options.cursor ? { cursor: options.cursor } : {}),
        ...(options.accountId ? { accountId: options.accountId } : {}),
        ...(typeof options.limit === "number" ? { limit: options.limit } : {}),
    };
}
function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
function normalizeError(error) {
    if (error instanceof connector_driver_1.ConnectorError) {
        return error;
    }
    if (error instanceof Error) {
        return new connector_driver_1.ConnectorError(error.message, "CONNECTOR_EXECUTION_FAILED", "", error);
    }
    return new connector_driver_1.ConnectorError(String(error), "CONNECTOR_EXECUTION_FAILED", "");
}
async function executeConnectorSandboxed(params) {
    const timeoutMs = params.sandbox?.timeoutMs ?? 30_000;
    const allowWallClockTime = params.sandbox?.allowWallClockTime ?? false;
    const fencedOptions = normalizeSyncOptions(params.options);
    const fencedCredentials = deepClone(params.credentials);
    try {
        const syncCall = params.driver.sync(fencedCredentials, fencedOptions);
        const result = await withTimeout(syncCall, timeoutMs);
        if (!allowWallClockTime && result.nextCursor && /\d{13}/.test(result.nextCursor)) {
            throw new connector_driver_1.ConnectorError("Connector returned time-variant cursor; set deterministic cursor or disable strict mode", "NON_DETERMINISTIC_CURSOR", params.driver.metadata.id);
        }
        return result;
    }
    catch (error) {
        throw normalizeError(error);
    }
}
//# sourceMappingURL=connector-sandbox.js.map