"use strict";
/**
 * Token refresh utility for automatic token renewal before expiry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = void 0;
const DEFAULT_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
/**
 * Token manager that handles automatic token refresh
 */
class TokenManager {
    tokenInfo = null;
    refreshPromise = null;
    config;
    constructor(config) {
        this.config = {
            refreshThreshold: config.refreshThreshold ?? DEFAULT_REFRESH_THRESHOLD,
            refreshFn: config.refreshFn,
        };
    }
    /**
     * Gets the current token, refreshing if necessary
     */
    async getToken() {
        const now = Date.now();
        const needsRefresh = !this.tokenInfo ||
            this.tokenInfo.expiresAt - now < this.config.refreshThreshold;
        if (needsRefresh) {
            // If a refresh is already in progress, wait for it
            if (this.refreshPromise) {
                this.tokenInfo = await this.refreshPromise;
                this.refreshPromise = null;
                return this.tokenInfo.token;
            }
            // Start a new refresh
            this.refreshPromise = this.config.refreshFn();
            try {
                this.tokenInfo = await this.refreshPromise;
                this.refreshPromise = null;
                return this.tokenInfo.token;
            }
            catch (error) {
                this.refreshPromise = null;
                throw error;
            }
        }
        if (!this.tokenInfo) {
            throw new Error("Token is not available");
        }
        return this.tokenInfo.token;
    }
    /**
     * Sets the token manually (useful for initial token or after external refresh)
     */
    setToken(tokenInfo) {
        this.tokenInfo = tokenInfo;
    }
    /**
     * Clears the current token (forces refresh on next getToken call)
     */
    clearToken() {
        this.tokenInfo = null;
        this.refreshPromise = null;
    }
}
exports.TokenManager = TokenManager;
//# sourceMappingURL=token-refresh.js.map