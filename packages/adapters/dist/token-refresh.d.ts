/**
 * Token Refresh
 *
 * Automatic token refresh for OAuth2 connectors
 */
import { ConnectorDriver } from "./connector-driver";
export interface TokenRefreshResult {
    refreshed: boolean;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresIn?: number | undefined;
    error?: string | undefined;
}
/**
 * Refresh token for a connector if needed
 */
export declare function refreshTokenIfNeeded(driver: ConnectorDriver, connectorId: string, tenantId: string, credentials: Record<string, unknown>, supabaseUrl: string, supabaseServiceKey: string): Promise<TokenRefreshResult>;
//# sourceMappingURL=token-refresh.d.ts.map