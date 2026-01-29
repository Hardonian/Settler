/**
 * Amazon Seller Connector Driver
 *
 * Amazon Seller Central integration
 * Supports manual upload (CSV reports) or SP-API if credentials available
 */

import {
  ConnectorDriver,
  ConnectorMetadata,
  TestConnectionOptions,
  TestConnectionResult,
  SyncOptions,
  SyncResult,
  NormalizedPayout,
  ConnectorError,
} from "../connector-driver";

export class AmazonSellerDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
    id: "amazon-seller",
    displayName: "Amazon Seller Central",
    category: "marketplace",
    authType: "manual_upload",
    description: "Sync Amazon Seller payouts and settlements via SP-API or CSV report upload",
    icon: "📦",
    documentationUrl: "https://developer-docs.amazon.com/sp-api",
    supportsWebhooks: false,
    supportsPolling: true,
    requiredConfig: [],
    optionalConfig: [
      "sp_api_client_id",
      "sp_api_client_secret",
      "sp_api_refresh_token",
      "sp_api_role_arn",
    ],
  };

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials } = options;

    // If SP-API credentials provided, test API connection
    if (credentials.sp_api_client_id && credentials.sp_api_client_secret) {
      try {
        // Test SP-API connection
        const tokenResponse = await fetch("https://api.amazon.com/auth/o2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: credentials.sp_api_refresh_token as string,
            client_id: credentials.sp_api_client_id as string,
            client_secret: credentials.sp_api_client_secret as string,
          }),
        });

        if (!tokenResponse.ok) {
          return {
            success: false,
            error: "SP-API authentication failed",
            message: "Please check your SP-API credentials",
          };
        }

        return {
          success: true,
          message: "SP-API connection successful",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    // Manual upload mode - always succeeds
    return {
      success: true,
      message: "Ready for CSV report upload",
      metadata: {
        mode: "manual_upload",
        instructions: "Upload settlement reports from Amazon Seller Central",
      },
    };
  }

  async sync(
    credentials: Record<string, unknown>,
    _options: SyncOptions
  ): Promise<
    SyncResult & {
      payouts?: NormalizedPayout[];
      rawPayloads?: Array<{ type: string; payload: unknown }>;
    }
  > {
    const payouts: NormalizedPayout[] = [];
    const rawPayloads: Array<{ type: string; payload: unknown }> = [];

    // Check if SP-API credentials available
    if (credentials.sp_api_client_id && credentials.sp_api_client_secret) {
      try {
        // Get access token
        const tokenResponse = await fetch("https://api.amazon.com/auth/o2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: credentials.sp_api_refresh_token as string,
            client_id: credentials.sp_api_client_id as string,
            client_secret: credentials.sp_api_client_secret as string,
          }),
        });

        if (!tokenResponse.ok) {
          throw new ConnectorError(
            "Failed to authenticate with SP-API",
            "AMAZON_SP_API_AUTH_FAILED",
            "amazon-seller"
          );
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch financial events (payouts)
        // Note: SP-API financial events endpoint
        const financialEventsResponse = await fetch(
          "https://sellingpartnerapi-na.amazon.com/finances/v0/financialEvents",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (financialEventsResponse.ok) {
          const eventsData = await financialEventsResponse.json();
          rawPayloads.push({ type: "financial_events", payload: eventsData });

          // Parse financial events into payouts
          // This is simplified - actual implementation would parse various event types
          for (const event of eventsData.payload?.FinancialEvents || []) {
            if (event.ShipmentEventList) {
              // Extract payout information from shipment events
              // This is a simplified mapping - future implementation will parse shipment events
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              for (const _shipment of event.ShipmentEventList) {
                // TODO: Parse shipment events into payouts
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof ConnectorError) {
          throw error;
        }
        throw new ConnectorError(
          `Amazon SP-API sync failed: ${error instanceof Error ? error.message : String(error)}`,
          "AMAZON_SP_API_SYNC_FAILED",
          "amazon-seller",
          error instanceof Error ? error : undefined
        );
      }
    } else {
      // Manual upload mode - return empty, data should be uploaded via UI
      return {
        hasMore: false,
        counts: {
          payouts: 0,
        },
        payouts: [],
        rawPayloads: [],
        warnings: [
          "No SP-API credentials configured. Please upload CSV reports manually or configure SP-API credentials.",
        ],
      };
    }

    return {
      hasMore: false,
      counts: {
        payouts: payouts.length,
      },
      payouts,
      rawPayloads,
    };
  }
}
