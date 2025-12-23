"use strict";
/**
 * Token Refresh
 *
 * Automatic token refresh for OAuth2 connectors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenIfNeeded = refreshTokenIfNeeded;
const supabase_js_1 = require("@supabase/supabase-js");
const credential_encryption_1 = require("./credential-encryption");
/**
 * Refresh token for a connector if needed
 */
async function refreshTokenIfNeeded(driver, connectorId, tenantId, credentials, supabaseUrl, supabaseServiceKey) {
    // Only refresh if driver supports it and refresh token exists
    if (!driver.refreshToken || !credentials.refresh_token) {
        return { refreshed: false };
    }
    // Check if token is expired or expiring soon (within 5 minutes)
    const expiresAt = credentials.token_expires_at;
    if (expiresAt) {
        const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        if (expiryDate > fiveMinutesFromNow) {
            return { refreshed: false }; // Token still valid
        }
    }
    try {
        const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        // Get connector record
        const { data: connector } = await supabase
            .from('connectors')
            .select('id, config')
            .eq('tenant_id', tenantId)
            .eq('provider_id', connectorId)
            .single();
        if (!connector) {
            return { refreshed: false, error: 'Connector not found' };
        }
        // Decrypt refresh token
        const refreshToken = await (0, credential_encryption_1.decryptToken)(credentials.refresh_token, supabaseUrl, supabaseServiceKey);
        // Refresh token
        const refreshResult = await driver.refreshToken(refreshToken, connector.config);
        // Encrypt and store new tokens
        const encryptedAccessToken = await (0, credential_encryption_1.encryptToken)(refreshResult.accessToken, supabaseUrl, supabaseServiceKey);
        const encryptedRefreshToken = refreshResult.refreshToken
            ? await (0, credential_encryption_1.encryptToken)(refreshResult.refreshToken, supabaseUrl, supabaseServiceKey)
            : credentials.refresh_token;
        const tokenExpiresAt = refreshResult.expiresIn
            ? new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString()
            : null;
        // Update credentials
        const { error: updateError } = await supabase
            .from('connector_credentials')
            .update({
            access_token_encrypted: encryptedAccessToken,
            refresh_token_encrypted: encryptedRefreshToken,
            token_expires_at: tokenExpiresAt,
            updated_at: new Date().toISOString(),
        })
            .eq('connector_id', connector.id);
        if (updateError) {
            return { refreshed: false, error: updateError.message };
        }
        return {
            refreshed: true,
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken,
            expiresIn: refreshResult.expiresIn,
        };
    }
    catch (error) {
        return {
            refreshed: false,
            error: error instanceof Error ? error.message : 'Token refresh failed',
        };
    }
}
//# sourceMappingURL=token-refresh.js.map