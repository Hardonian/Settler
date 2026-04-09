# Connector Documentation

This directory contains documentation for each connector integration.

## Available Connectors

### Bank Feeds

- [Plaid](./plaid.md) - North America bank aggregation
- [TrueLayer](./truelayer.md) - EU/UK bank aggregation

### Accounting

- FreshBooks - Small business accounting
- Wave - Free accounting software

### Subscription Billing

- Chargebee - Subscription management
- Recurly - Recurring billing

### Marketplaces

- Stripe Connect - Connected accounts
- Amazon Seller - Seller Central
- Etsy - Etsy marketplace
- eBay - eBay marketplace

### Enterprise/ERP

- NetSuite - ERP system
- SAP - SAP ERP

### Tax

- Avalara - Tax calculation
- TaxJar - Tax calculation

## Common Setup Steps

1. **Get API Credentials**
   - Sign up for provider account
   - Create application/integration
   - Copy credentials

2. **Configure Environment Variables**
   - Add required env vars to `.env.local`
   - See individual connector docs for specific vars

3. **Connect Integration**
   - Navigate to Integrations page
   - Click "Connect" on desired connector
   - Complete OAuth flow or enter API keys

4. **Test Connection**
   - Use "Test Connection" button
   - Verify successful connection

5. **Sync Data**
   - Automatic sync runs periodically
   - Manual sync available via "Sync Now"
   - View logs for sync history

## Troubleshooting

### Connection Issues

- Verify credentials are correct
- Check environment variables
- Test connection via API

### Sync Issues

- Check sync logs for errors
- Verify rate limits not exceeded
- Ensure connector is not disabled

### Data Issues

- Check normalization mapping
- Verify idempotency keys
- Review raw payloads in database

## Support

For connector-specific issues, see individual connector documentation.
For general integration issues, see [Operator Runbook](../operator-runbook.md).
