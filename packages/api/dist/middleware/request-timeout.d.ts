/**
 * Request Timeout Middleware
 * Ensures requests don't hang indefinitely
 */
import { Request, Response, NextFunction } from 'express';
interface TimeoutRequest extends Request {
    timeout?: NodeJS.Timeout;
    startTime?: number;
}
/**
 * Request timeout middleware
 * Automatically cancels requests that exceed the timeout
 */
export declare function requestTimeoutMiddleware(timeoutMs?: number): (req: TimeoutRequest, res: Response, next: NextFunction) => void;
/**
 * Get request timeout based on route
 */
export declare function getRequestTimeout(path: string, method: string): number;
export {};
//# sourceMappingURL=request-timeout.d.ts.map