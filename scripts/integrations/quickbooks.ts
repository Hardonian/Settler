/**
 * QuickBooks Integration Template
 * For Settler reconciliation sync
 *
 */

export interface AdapterConfig {
  [key: string]: unknown;
}

export interface ProviderAdapter {
  fetchInvoices?(since?: Date): Promise<any[]>;
  fetchAccounts?(): Promise<any[]>;
  fetchTransactions?(): Promise<any[]>;
}

export interface QuickBooksConfig extends AdapterConfig {
  realmId: string;
  accessToken: string;
  refreshToken: string;
  environment: "sandbox" | "production";
}

export interface QuickBooksInvoice {
  Id: string;
  DocNumber: string;
  CustomerRef: { value: string; name: string };
  TotalAmt: number;
  Balance: number;
  DueDate: string;
  Line: Array<{
    Amount: number;
    Description: string;
    DetailType: "SalesItemLineDetail";
  }>;
}

export class QuickBooksAdapter implements ProviderAdapter {
  private baseUrl: string;
  private realmId: string;
  private accessToken: string;
  private environment: "sandbox" | "production";

  constructor(config: QuickBooksConfig) {
    this.realmId = config.realmId;
    this.accessToken = config.accessToken;
    this.environment = config.environment;
    this.baseUrl =
      config.environment === "production"
        ? "https://quickbooks.api.intuit.com"
        : "https://sandbox-quickbooks.api.intuit.com";
  }

  async fetchInvoices(since?: Date): Promise<QuickBooksInvoice[]> {
    const query = `SELECT * FROM Invoice WHERE MetaData.LastUpdatedTime > '${since?.toISOString()}'`;

    const response = await fetch(
      `${this.baseUrl}/v3/company/${this.realmId}/query?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();
    return data.QueryResponse?.Invoice || [];
  }

  async fetchAccounts(): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/v3/company/${this.realmId}/query?query=SELECT * FROM Account`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();
    return data.QueryResponse?.Account || [];
  }

  // Reconciliation sync helpers
  async reconcileInvoice(invoice: QuickBooksInvoice): Promise<{
    matched: boolean;
    amount: number;
    confidence: number;
  }> {
    // Query Settler for matching invoice
    // Return reconciliation result
    return {
      matched: false,
      amount: 0,
      confidence: 0,
    };
  }

  // OAuth flow methods
  async getAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    scope: string,
    state: string
  ): Promise<string> {
    const baseUrl =
      this.environment === "production"
        ? "https://appcenter.intuit.com/connect/oauth2"
        : "https://appcenter.intuit.com/connect/oauth2";

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  async handleOAuthCallback(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; realmId: string }> {
    const tokenUrl =
      this.environment === "production"
        ? "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
        : "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth callback failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      realmId: this.realmId, // Assuming realmId is parsed separately or passed in
    };
  }

  // Webhook listener method
  handleWebhook(payload: string, signature: string, verifierToken: string): boolean {
    const crypto = require("crypto");
    const hash = crypto.createHmac("sha256", verifierToken).update(payload).digest("base64");

    return hash === signature;
  }
}

/**
 * Xero Integration Template
 * Alternative to QuickBooks
 */

export interface XeroConfig extends AdapterConfig {
  tenantId: string;
  accessToken: string;
}

export class XeroAdapter implements ProviderAdapter {
  private accessToken: string;
  private tenantId: string;

  constructor(config: XeroConfig) {
    this.accessToken = config.accessToken;
    this.tenantId = config.tenantId;
  }

  async fetchInvoices(): Promise<any[]> {
    const response = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Xero-tenant-id": this.tenantId,
        Accept: "application/json",
      },
    });

    const data = await response.json();
    return data.Invoices || [];
  }
}

/**
 * NetSuite Integration Template
 * Enterprise reconciliation
 */

export interface NetSuiteConfig extends AdapterConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

export class NetSuiteAdapter implements ProviderAdapter {
  private accountId: string;

  constructor(config: NetSuiteConfig) {
    this.accountId = config.accountId;
  }

  async fetchTransactions(): Promise<any[]> {
    // NetSuite requires SOAP or RESTlet
    // Placeholder for NetSuite RESTlet integration
    return [];
  }
}
