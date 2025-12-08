import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { query } from "../db";
import { v4 as uuidv4 } from "uuid";

export function idempotencyMiddleware() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Only apply to state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    if (!req.userId) {
      return next();
    }

    // Get idempotency key from header or generate one
    const idempotencyKey = (req.headers['idempotency-key'] as string) || uuidv4();
    
    // Check if we've seen this request
    const cached = await query<{ response: { statusCode?: number; data: unknown }; created_at: Date }>(
      `SELECT response, created_at
       FROM idempotency_keys
       WHERE user_id = $1 AND key = $2 AND expires_at > NOW()`,
      [req.userId, idempotencyKey]
    );

    if (cached.length > 0 && cached[0]) {
      // Return cached response
      const cachedResponse = cached[0].response;
      res.status(cachedResponse.statusCode || 200).json(cachedResponse.data);
      return;
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let statusCode = 200;
    let responseData: unknown;

    // Override json to capture response
    res.json = function(data: unknown) {
      responseData = data;
      return originalJson(data);
    };

    res.status = function(code: number) {
      statusCode = code;
      return originalStatus(code);
    };

    // Call next middleware
    await new Promise<void>((resolve) => {
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: unknown, encoding?: BufferEncoding, cb?: () => void) {
        // Cache successful responses (2xx)
        if (statusCode >= 200 && statusCode < 300) {
          query(
            `INSERT INTO idempotency_keys (user_id, key, response, expires_at)
             VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
             ON CONFLICT (user_id, key) DO NOTHING`,
            [
              req.userId || null,
              idempotencyKey,
              JSON.stringify({ statusCode, data: responseData }),
            ]
          ).catch(err => console.error('Failed to cache idempotency key', err));
        }
        if (encoding !== undefined && typeof encoding === 'string') {
          originalEnd(chunk, encoding, cb);
        } else if (cb !== undefined) {
          originalEnd(chunk, cb);
        } else {
          originalEnd(chunk);
        }
        resolve();
      } as typeof originalEnd;
      next();
    });
  };
}
