import { AuthRequest } from '../middleware/auth';
export interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
}
export declare function getTraceContext(req: AuthRequest): TraceContext;
export declare function getParentTraceContext(spanId: string): TraceContext | null;
export declare function createChildSpan(parentSpanId: string): TraceContext;
export declare function endSpan(spanId: string): void;
export declare function trace<T>(name: string, operation: () => Promise<T>, context?: TraceContext): Promise<T>;
//# sourceMappingURL=tracing.d.ts.map