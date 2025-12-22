# Plaid Connector

Bank aggregation for North America via Plaid Link.

## Overview

The Plaid connector enables automatic sync of bank accounts, transactions, and balances from North American financial institutions.

## Setup

### Prerequisites

1. Plaid account with API credentials
2. Plaid Link integration configured

### Environment Variables

```bash
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENVIRONMENT=sandbox|development|production
```

### Configuration Steps

1. **Get Plaid Credentials**
   - Sign up at https://dashboard.plaid.com
   - Create a new application
   - Copy Client ID and Secret

2. **Connect Integration**
   - Navigate to Integrations page
   - Click "Connect" on Plaid card
   - Complete Plaid Link flow
   - Grant permissions for accounts and transactions

3. **Verify Connection**
   - Click "Test Connection" to verify
   - Check sync logs for successful syncs

## Features

- **OAuth2 Flow**: Secure Plaid Link integration
- **Account Sync**: Automatic account discovery and sync
- **Transaction Sync**: Real-time transaction updates
- **Balance Sync**: Current and available balances
- **Webhooks**: Optional webhook support for real-time updates

## Data Synced

- **Accounts**: Bank accounts, account types, balances
- **Transactions**: All transactions with metadata
- **Balances**: Current and available balances per account

## Common Errors

### "Invalid credentials"
- Verify PLAID_CLIENT_ID and PLAID_SECRET are correct
- Check environment matches (sandbox vs production)

### "Item not found"
- Reconnect the integration
- Verify the Plaid item is still active

### "Rate limit exceeded"
- Plaid has rate limits per item
- Wait before retrying sync

## Troubleshooting

1. **Check Sync Logs**: View sync history in integration logs
2. **Test Connection**: Use "Test Connection" button
3. **Reconnect**: Disconnect and reconnect if issues persist

## Support

- Plaid Documentation: https://plaid.com/docs
- Plaid Support: https://dashboard.plaid.com/support
