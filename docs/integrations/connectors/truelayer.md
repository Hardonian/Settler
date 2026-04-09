# TrueLayer Connector

Bank aggregation for EU/UK via TrueLayer (PSD2).

## Overview

The TrueLayer connector enables automatic sync of bank accounts, transactions, and balances from European and UK financial institutions using PSD2 regulations.

## Setup

### Prerequisites

1. TrueLayer account with API credentials
2. OAuth2 application configured

### Environment Variables

```bash
TRUELAYER_CLIENT_ID=your-truelayer-client-id
TRUELAYER_CLIENT_SECRET=your-truelayer-client-secret
TRUELAYER_ENVIRONMENT=sandbox|production
```

### Configuration Steps

1. **Get TrueLayer Credentials**
   - Sign up at https://console.truelayer.com
   - Create a new application
   - Copy Client ID and Secret

2. **Connect Integration**
   - Navigate to Integrations page
   - Click "Connect" on TrueLayer card
   - Complete OAuth2 flow
   - Grant permissions for accounts and transactions

3. **Verify Connection**
   - Click "Test Connection" to verify
   - Check sync logs for successful syncs

## Features

- **OAuth2 Flow**: Secure OAuth2 integration
- **Token Refresh**: Automatic token refresh
- **Account Sync**: Automatic account discovery and sync
- **Transaction Sync**: Real-time transaction updates
- **Balance Sync**: Current and available balances

## Data Synced

- **Accounts**: Bank accounts, account types, balances
- **Transactions**: All transactions with metadata
- **Balances**: Current and available balances per account

## Common Errors

### "Invalid credentials"

- Verify TRUELAYER_CLIENT_ID and TRUELAYER_CLIENT_SECRET are correct
- Check environment matches (sandbox vs production)

### "Token expired"

- Tokens refresh automatically
- Reconnect if refresh fails

## Troubleshooting

1. **Check Sync Logs**: View sync history in integration logs
2. **Test Connection**: Use "Test Connection" button
3. **Reconnect**: Disconnect and reconnect if issues persist

## Support

- TrueLayer Documentation: https://docs.truelayer.com
- TrueLayer Support: https://console.truelayer.com/support
