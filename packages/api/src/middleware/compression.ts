/**
 * Compression Middleware
 * Supports Gzip and Brotli compression for API responses
 */

import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import * as zlib from 'zlib';
import { promisify } from 'util';

const brotliCompress = promisify(zlib.brotliCompress);

// Check if client accepts Brotli
function acceptsBrotli(req: Request): boolean {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  return acceptEncoding.includes('br');
}

// Check if client accepts Gzip
function acceptsGzip(req: Request): boolean {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  return acceptEncoding.includes('gzip');
}

// Standard compression middleware (Gzip)
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't accept it
    if (!acceptsGzip(req) && !acceptsBrotli(req)) {
      return false;
    }

    // Don't compress if response is already compressed
    if (res.getHeader('content-encoding')) {
      return false;
    }

    // Don't compress small responses (< 1KB)
    const contentLength = res.getHeader('content-length');
    if (contentLength && parseInt(contentLength as string, 10) < 1024) {
      return false;
    }

    // Compress JSON, text, and HTML responses
    const contentType = res.getHeader('content-type') || '';
    return /json|text|html/.test(contentType as string);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses > 1KB
});

// Brotli compression middleware (higher compression ratio)
export async function brotliCompressionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only apply if client accepts Brotli
  if (!acceptsBrotli(req)) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body: unknown) {
    // Only compress JSON/text responses
    const contentType = res.getHeader('content-type') || '';
    if (!/json|text|html/.test(contentType as string)) {
      return originalSend.call(this, body);
    }

    // Only compress if body is large enough
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    if (bodyString.length < 1024) {
      return originalSend.call(this, body);
    }

    // Compress with Brotli
    brotliCompress(Buffer.from(bodyString))
      .then((compressed: Buffer) => {
        res.setHeader('content-encoding', 'br');
        res.setHeader('content-length', compressed.length.toString());
        originalSend.call(this, compressed);
      })
      .catch((error: unknown) => {
        // Fallback to uncompressed
        console.error('Brotli compression failed:', error);
        originalSend.call(this, body);
      });

    return res;
  };

  next();
}
