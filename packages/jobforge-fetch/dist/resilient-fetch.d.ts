import type { ResilientFetchOptions, FetchMetadata } from "./types";
/**
 * Resilient fetch with timeout and retry support.
 * Automatically handles transient failures with exponential backoff.
 */
export declare function resilientFetch(url: string | URL, options?: ResilientFetchOptions): Promise<Response>;
/**
 * Type guard to check if response has metadata
 */
export declare function hasMetadata(response: Response): response is Response & {
    metadata: FetchMetadata;
};
//# sourceMappingURL=resilient-fetch.d.ts.map