/**
 * Request Signing Middleware
 * 
 * Implements HMAC request signing for webhook security and API authentication
 * Supports multiple signature algorithms (HMAC-SHA256, HMAC-SHA512)
 * 
 * Usage:
 * - Webhook signature verification
 * - API request signing for third-party integrations
 * - Request replay protection via timestamp validation
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logWarn, logError } from '../utils/logger';

export interface SignedRequest extends Request {
  signature?: {
    algorithm: string;
    timestamp: number;
    signature: string;
    verified: boolean;
  };
}

/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
  valid: boolean;
  reason?: string;
  algorithm?: string;
  timestamp?: number;
}

/**
 * Request signing configuration
 */
export interface RequestSigningConfig {
  secret: string;
  algorithm?: 'sha256' | 'sha512';
  timestampTolerance?: number; // seconds
  headerName?: string;
  timestampHeaderName?: string;
}

/**
 * Verify request signature
 */
export function verifyRequestSignature(
  payload: string | Buffer,
  signature: string,
  timestamp: string | number,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): SignatureVerificationResult {
  try {
    const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes default

    // Check timestamp freshness
    if (Math.abs(now - timestampNum) > tolerance) {
      return {
        valid: false,
        reason: 'Timestamp out of tolerance',
        timestamp: timestampNum,
      };
    }

    // Create signed payload
    const signedPayload = `${timestampNum}.${typeof payload === 'string' ? payload : payload.toString()}`;
    const hash = crypto
      .createHmac(algorithm, secret)
      .update(signedPayload)
      .digest('hex');

    // Extract signature from header (format: v1=signature or just signature)
    const signatureValue = signature.startsWith('v1=') ? signature.substring(3) : signature;

    // Constant-time comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signatureValue)
    );

    return {
      valid: isValid,
      algorithm,
      timestamp: timestampNum,
      reason: isValid ? undefined : 'Signature mismatch',
    };
  } catch (error) {
    return {
      valid: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate request signature
 */
export function generateRequestSignature(
  payload: string | Buffer,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): { signature: string; timestamp: number; header: string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${typeof payload === 'string' ? payload : payload.toString()}`;
  const signature = crypto
    .createHmac(algorithm, secret)
    .update(signedPayload)
    .digest('hex');

  return {
    signature: `v1=${signature}`,
    timestamp,
    header: `t=${timestamp},v1=${signature}`,
  };
}

/**
 * Request signing middleware factory
 */
export function requestSigningMiddleware(config: RequestSigningConfig) {
  return (req: SignedRequest, res: Response, next: NextFunction) => {
    const signatureHeader = req.headers[config.headerName || 'x-signature'] as string;
    const timestampHeader = req.headers[config.timestampHeaderName || 'x-signature-timestamp'] as string;

    if (!signatureHeader || !timestampHeader) {
      logWarn('Missing signature headers', {
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing signature headers',
      });
    }

    // Get request body as string
    const payload = typeof req.body === 'string' 
      ? req.body 
      : JSON.stringify(req.body);

    const verification = verifyRequestSignature(
      payload,
      signatureHeader,
      timestampHeader,
      config.secret,
      config.algorithm
    );

    if (!verification.valid) {
      logWarn('Invalid request signature', {
        path: req.path,
        method: req.method,
        reason: verification.reason,
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: verification.reason || 'Invalid signature',
      });
    }

    // Attach signature info to request
    req.signature = {
      algorithm: verification.algorithm || config.algorithm || 'sha256',
      timestamp: verification.timestamp || parseInt(timestampHeader, 10),
      signature: signatureHeader,
      verified: true,
    };

    next();
  };
}

/**
 * Webhook signature verification middleware (for incoming webhooks)
 */
export function webhookSignatureMiddleware(secret: string) {
  return (req: SignedRequest, res: Response, next: NextFunction) => {
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;

    if (!signature || !timestamp) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing webhook signature',
      });
    }

    const rawBody = typeof req.body === 'string' 
      ? req.body 
      : JSON.stringify(req.body);

    const verification = verifyRequestSignature(
      rawBody,
      signature,
      timestamp,
      secret
    );

    if (!verification.valid) {
      logError('Webhook signature verification failed', undefined, {
        path: req.path,
        reason: verification.reason,
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature',
      });
    }

    req.signature = {
      algorithm: verification.algorithm || 'sha256',
      timestamp: verification.timestamp || parseInt(timestamp, 10),
      signature,
      verified: true,
    };

    next();
  };
}
