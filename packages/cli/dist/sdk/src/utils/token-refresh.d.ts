/**
 * Token refresh utility for automatic token renewal before expiry
 */
export interface TokenInfo {
    token: string;
    expiresAt: number;
}
export interface TokenRefreshConfig {
    /** Refresh token when it expires in less than this many milliseconds (default: 5 minutes) */
    refreshThreshold?: number;
    /** Function to refresh the token */
    refreshFn: () => Promise<TokenInfo>;
}
/**
 * Token manager that handles automatic token refresh
 */
export declare class TokenManager {
    private tokenInfo;
    private refreshPromise;
    private readonly config;
    constructor(config: TokenRefreshConfig);
    /**
     * Gets the current token, refreshing if necessary
     */
    getToken(): Promise<string>;
    /**
     * Sets the token manually (useful for initial token or after external refresh)
     */
    setToken(tokenInfo: TokenInfo): void;
    /**
     * Clears the current token (forces refresh on next getToken call)
     */
    clearToken(): void;
}
//# sourceMappingURL=token-refresh.d.ts.map