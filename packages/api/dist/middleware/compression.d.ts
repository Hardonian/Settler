/**
 * Compression Middleware
 * Supports Gzip and Brotli compression for API responses
 */
import { Request, Response, NextFunction } from 'express';
export declare const compressionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare function brotliCompressionMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=compression.d.ts.map