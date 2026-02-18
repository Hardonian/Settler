"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPORT_SCHEMA_VERSION = void 0;
exports.stableStringify = stableStringify;
exports.computeReconciliationHash = computeReconciliationHash;
exports.computeChainHash = computeChainHash;
exports.validateHashChain = validateHashChain;
const node_crypto_1 = require("node:crypto");
exports.EXPORT_SCHEMA_VERSION = "1.0.0";
function canonicalize(value) {
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }
    if (value && typeof value === "object") {
        const result = {};
        for (const key of Object.keys(value).sort()) {
            result[key] = canonicalize(value[key]);
        }
        return result;
    }
    return value;
}
function stableStringify(value) {
    return JSON.stringify(canonicalize(value));
}
function computeReconciliationHash(run, matches) {
    const payload = {
        run,
        matches: [...matches].sort((a, b) => {
            const aId = a.id ?? "";
            const bId = b.id ?? "";
            return aId.localeCompare(bId);
        }),
    };
    return (0, node_crypto_1.createHash)("sha256").update(stableStringify(payload)).digest("hex");
}
function computeChainHash(previousHash, reconciliationHash) {
    return (0, node_crypto_1.createHash)("sha256")
        .update(`${previousHash ?? "GENESIS"}:${reconciliationHash}`)
        .digest("hex");
}
function validateHashChain(chain) {
    let expectedPreviousHash = null;
    for (let index = 0; index < chain.length; index += 1) {
        const entry = chain[index];
        if (!entry) {
            return { valid: false, brokenIndex: index };
        }
        if (entry.previousHash !== expectedPreviousHash) {
            return { valid: false, brokenIndex: index };
        }
        const expectedChainHash = computeChainHash(entry.previousHash, entry.reconciliationHash);
        if (entry.chainHash !== expectedChainHash) {
            return { valid: false, brokenIndex: index };
        }
        expectedPreviousHash = entry.chainHash;
    }
    return { valid: true, brokenIndex: null };
}
//# sourceMappingURL=export-integrity.js.map