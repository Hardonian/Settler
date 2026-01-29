/**
 * Token Refresh
 *
 * Automatic token refresh for OAuth2 connectors
 */

import { ConnectorDriver } from "./connector-driver";
import { createClient } from "@supabase/supabase-js";
import { encryptToken, decryptToken } from "./credential-encryption";

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
export async function refreshTokenIfNeeded(
  driver: ConnectorDriver,
  connectorId: string,
  tenantId: string,
  credentials: Record<string, unknown>,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<TokenRefreshResult> {
  // Only refresh if driver supports it and refresh token exists
  if (!driver.refreshToken || !credentials.refresh_token) {
    return { refreshed: false };
  }

  // Check if token is expired or expiring soon (within 5 minutes)
  const expiresAt = credentials.token_expires_at as Date | string | undefined;
  if (expiresAt) {
    const expiryDate = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiryDate > fiveMinutesFromNow) {
      return { refreshed: false }; // Token still valid
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get connector record
    const { data: connector } = await supabase
      .from("connectors")
      .select("id, config")
      .eq("tenant_id", tenantId)
      .eq("provider_id", connectorId)
      .single();

    if (!connector) {
      return { refreshed: false, error: "Connector not found" };
    }

    // Decrypt refresh token
    const refreshToken = await decryptToken(
      credentials.refresh_token as string,
      supabaseUrl,
      supabaseServiceKey
    );

    // Refresh token
    const refreshResult = await driver.refreshToken(
      refreshToken,
      connector.config as Record<string, unknown>
    );

    // Encrypt and store new tokens
    const encryptedAccessToken = await encryptToken(
      refreshResult.accessToken,
      supabaseUrl,
      supabaseServiceKey
    );

    const encryptedRefreshToken = refreshResult.refreshToken
      ? await encryptToken(refreshResult.refreshToken, supabaseUrl, supabaseServiceKey)
      : (credentials.refresh_token as string);

    const tokenExpiresAt = refreshResult.expiresIn
      ? new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString()
      : null;

    // Update credentials
    const { error: updateError } = await supabase
      .from("connector_credentials")
      .update({
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("connector_id", connector.id);

    if (updateError) {
      return { refreshed: false, error: updateError.message };
    }

    const result: TokenRefreshResult = {
      refreshed: true,
      accessToken: refreshResult.accessToken,
    };

    if (refreshResult.refreshToken) {
      result.refreshToken = refreshResult.refreshToken;
    }
    if (refreshResult.expiresIn) {
      result.expiresIn = refreshResult.expiresIn;
    }

    return result;
  } catch (error) {
    return {
      refreshed: false,
      error: error instanceof Error ? error.message : "Token refresh failed",
    };
  }
}
