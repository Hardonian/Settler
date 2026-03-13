"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = idempotencyMiddleware;
const crypto_1 = require("crypto");
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const api_response_1 = require("../utils/api-response");
const IDEMPOTENCY_TTL_HOURS = 24;
const MAX_KEY_LENGTH = 128;
function getRequestHash(req) {
    const body = req.body === undefined ? "" : JSON.stringify(req.body);
    return (0, crypto_1.createHash)("sha256")
        .update(`${req.method}:${req.path}:${body}`)
        .digest("hex");
}
function idempotencyMiddleware() {
    const middleware = async function idempotencyHandler(req, res, next) {
        if (!req.userId || !["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
            return next();
        }
        const idempotencyKey = req.headers["idempotency-key"];
        if (!idempotencyKey) {
            return next();
        }
        if (idempotencyKey.length > MAX_KEY_LENGTH) {
            (0, api_response_1.sendError)(res, 400, "INVALID_IDEMPOTENCY_KEY", `Idempotency key exceeds ${MAX_KEY_LENGTH} chars`);
            return;
        }
        const requestHash = getRequestHash(req);
        try {
            const cached = await (0, db_1.query)(`SELECT response
         FROM idempotency_keys
         WHERE user_id = $1 AND key = $2 AND expires_at > NOW()`, [req.userId, idempotencyKey]);
            if (cached[0]?.response) {
                const existing = cached[0].response;
                if (existing.requestHash && existing.requestHash !== requestHash) {
                    (0, api_response_1.sendError)(res, 409, "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD", "Idempotency key was already used with a different request payload");
                    return;
                }
                res.setHeader("X-Idempotent-Replay", "true");
                res.status(existing.statusCode || 200).json(existing.data);
                return;
            }
        }
        catch (error) {
            (0, logger_1.logError)("Idempotency pre-check failed", error);
            return next();
        }
        const originalJson = res.json.bind(res);
        const originalStatus = res.status.bind(res);
        let statusCode = 200;
        let responseData;
        res.status = function patchedStatus(code) {
            statusCode = code;
            return originalStatus(code);
        };
        res.json = function patchedJson(data) {
            responseData = data;
            return originalJson(data);
        };
        res.once("finish", () => {
            if (statusCode < 200 || statusCode >= 300) {
                return;
            }
            const payload = {
                statusCode,
                data: responseData,
                requestHash,
            };
            void (0, db_1.query)(`INSERT INTO idempotency_keys (user_id, key, response, expires_at)
         VALUES ($1, $2, $3::jsonb, NOW() + ($4 || ' hours')::interval)
         ON CONFLICT (user_id, key)
         DO UPDATE SET response = EXCLUDED.response, expires_at = EXCLUDED.expires_at`, [req.userId, idempotencyKey, JSON.stringify(payload), IDEMPOTENCY_TTL_HOURS]).catch((error) => {
                (0, logger_1.logError)("Failed to persist idempotency response", error);
            });
        });
        next();
    };
    return middleware;
}
//# sourceMappingURL=idempotency.js.map