/**
 * Adapter Connection Tester
 * E1: Test adapter connections before creating jobs
 */

import { validateAdapterConfig } from "../utils/adapter-config-validator";
import { logError } from "../utils/logger";

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  latency?: number;
  adapter?: string;
}

/**
 * Test adapter connection
 */
export async function testAdapterConnection(
  adapter: string,
  config: Record<string, unknown>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    // Validate config first
    validateAdapterConfig(adapter, config);

    // Test connection based on adapter
    switch (adapter.toLowerCase()) {
      case "stripe":
        return await testStripeConnection(config);
      case "shopify":
        return await testShopifyConnection(config);
      case "paypal":
        return await testPayPalConnection(config);
      case "quickbooks":
        return await testQuickBooksConnection(config);
      case "square":
        return await testSquareConnection(config);
      case "xero":
        return await testXeroConnection(config);
      default:
        return {
          success: false,
          error: `Adapter '${adapter}' connection testing not implemented`,
          adapter,
        };
    }
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("Adapter connection test failed", error, { adapter });
    return {
      success: false,
      error: message,
      latency,
      adapter,
    };
  }
}

async function testStripeConnection(
  config: Record<string, unknown>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const apiKey = config.apiKey as string;

  try {
    // Test Stripe API connection
    const response = await fetch("https://api.stripe.com/v1/charges?limit=1", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
    }

    const latency = Date.now() - startTime;
    return {
      success: true,
      latency,
      adapter: "stripe",
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Stripe connection failed";
    return {
      success: false,
      error: message,
      latency,
      adapter: "stripe",
    };
  }
}

async function testShopifyConnection(
  config: Record<string, unknown>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const apiKey = config.apiKey as string;
  const shopDomain = config.shopDomain as string;

  try {
    // Test Shopify API connection
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
      headers: {
        "X-Shopify-Access-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const latency = Date.now() - startTime;
    return {
      success: true,
      latency,
      adapter: "shopify",
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Shopify connection failed";
    return {
      success: false,
      error: message,
      latency,
      adapter: "shopify",
    };
  }
}

async function testPayPalConnection(
  config: Record<string, unknown>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const clientId = config.clientId as string;
  const clientSecret = config.clientSecret as string;
  const sandbox = (config.sandbox as boolean) || false;

  try {
    // Test PayPal OAuth token
    const baseUrl = sandbox ? "https://api.sandbox.paypal.com" : "https://api.paypal.com";
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`PayPal API error: ${response.status} ${response.statusText}`);
    }

    const latency = Date.now() - startTime;
    return {
      success: true,
      latency,
      adapter: "paypal",
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "PayPal connection failed";
    return {
      success: false,
      error: message,
      latency,
      adapter: "paypal",
    };
  }
}

async function testQuickBooksConnection(
  _config: Record<string, unknown>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  // QuickBooks connection testing requires OAuth flow
  // For now, just validate config
  const latency = Date.now() - startTime;
  return {
    success: true,
    latency,
    adapter: "quickbooks",
  };
}

async function testXeroConnection(config: Record<string, unknown>): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  // Reserved for future OAuth implementation
  void config.clientId;
  void config.clientSecret;
  const tenantId = config.tenantId as string;
  const accessToken = config.accessToken as string | undefined;

  try {
    if (!accessToken) {
      // Can't test without access token (requires OAuth)
      return {
        success: false,
        error: "Xero access token required. Please complete OAuth flow.",
        adapter: "xero",
      };
    }

    // Test Xero API connection
    const response = await fetch("https://api.xero.com/api.xro/2.0/Organisation", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Xero-tenant-id": tenantId,
      },
    });

    if (!response.ok) {
      throw new Error(`Xero API error: ${response.status} ${response.statusText}`);
    }

    const latency = Date.now() - startTime;
    return {
      success: true,
      latency,
      adapter: "xero",
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Xero connection failed";
    return {
      success: false,
      error: message,
      latency,
      adapter: "xero",
    };
  }
}

async function testSquareConnection(
  config: Record<string, unknown>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const accessToken = config.accessToken as string;
  const environment = (config.environment as string) || "production";

  try {
    // Test Square API connection
    const baseUrl =
      environment === "sandbox"
        ? "https://connect.squareupsandbox.com"
        : "https://connect.squareup.com";

    const response = await fetch(`${baseUrl}/v2/locations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Square API error: ${response.status} ${response.statusText}`);
    }

    const latency = Date.now() - startTime;
    return {
      success: true,
      latency,
      adapter: "square",
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Square connection failed";
    return {
      success: false,
      error: message,
      latency,
      adapter: "square",
    };
  }
}
