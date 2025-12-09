import { Response, NextFunction } from 'express';
import { AuthRequest } from "../middleware/auth";
export declare function checkRateLimit(req: AuthRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
}>;
export declare function rateLimitMiddleware(): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rate-limiter.d.ts.map