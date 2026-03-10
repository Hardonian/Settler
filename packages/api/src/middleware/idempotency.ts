import { Response, NextFunction } from "express";
import { createHash } from "crypto";
import { AuthRequest } from "./auth";
import { query } from "../db";
import { logError } from "../utils/logger";
import { sendError } from "../utils/api-response";

const IDEMPOTENCY_TTL_HOURS = 24;
const MAX_KEY_LENGTH = 128;

type CachedIdempotencyResponse = {
  statusCode?: number;
  data: unknown;
  requestHash?: string;
};

function getRequestHash(req: AuthRequest): string {
  const body = req.body === undefined ? "" : JSON.stringify(req.body);
  return createHash("sha256")
    .update(`${req.method}:${req.path}:${body}`)
    .digest("hex");
}

export function idempotencyMiddleware() {
  const middleware = async function idempotencyHandler(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.userId || !["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    if (!idempotencyKey) {
      return next();
    }

    if (idempotencyKey.length > MAX_KEY_LENGTH) {
      sendError(res, 400, "INVALID_IDEMPOTENCY_KEY", `Idempotency key exceeds ${MAX_KEY_LENGTH} chars`);
      return;
    }

    const requestHash = getRequestHash(req);

    try {
      const cached = await query<{ response: CachedIdempotencyResponse }>(
        `SELECT response
         FROM idempotency_keys
         WHERE user_id = $1 AND key = $2 AND expires_at > NOW()`,
        [req.userId, idempotencyKey]
      );

      if (cached[0]?.response) {
        const existing = cached[0].response;
        if (existing.requestHash && existing.requestHash !== requestHash) {
          sendError(
            res,
            409,
            "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD",
            "Idempotency key was already used with a different request payload"
          );
          return;
        }

        res.setHeader("X-Idempotent-Replay", "true");
        res.status(existing.statusCode || 200).json(existing.data);
        return;
      }
    } catch (error: unknown) {
      logError("Idempotency pre-check failed", error);
      return next();
    }

    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let statusCode = 200;
    let responseData: unknown;

    res.status = function patchedStatus(code: number) {
      statusCode = code;
      return originalStatus(code);
    };

    res.json = function patchedJson(data: unknown) {
      responseData = data;
      return originalJson(data);
    };

    res.once("finish", () => {
      if (statusCode < 200 || statusCode >= 300) {
        return;
      }

      const payload: CachedIdempotencyResponse = {
        statusCode,
        data: responseData,
        requestHash,
      };

      void query(
        `INSERT INTO idempotency_keys (user_id, key, response, expires_at)
         VALUES ($1, $2, $3::jsonb, NOW() + ($4 || ' hours')::interval)
         ON CONFLICT (user_id, key)
         DO UPDATE SET response = EXCLUDED.response, expires_at = EXCLUDED.expires_at`,
        [req.userId as string, idempotencyKey, JSON.stringify(payload), IDEMPOTENCY_TTL_HOURS]
      ).catch((error: unknown) => {
        logError("Failed to persist idempotency response", error);
      });
    });

    next();
  };

  return middleware;
}
