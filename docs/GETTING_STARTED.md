# Getting Started with Settler

Complete guide to get started with Settler in 5 minutes.

## Step 1: Sign Up

1. Navigate to `https://your-domain.com` (or `http://localhost:3000` locally)
2. Click "Sign Up" or navigate to `/signup`
3. Create your account
4. Verify your email (if required)

## Step 2: Access Developer Console

1. After signing up, navigate to `/console`
2. You'll see the Console overview dashboard
3. Explore the navigation sidebar

## Step 3: Create Your First API Key

1. Go to `/console/api-keys`
2. Click "Create API Key"
3. Enter a name (e.g., "My First Key")
4. Select scopes (or use default `*` for all)
5. Click "Create"
6. **IMPORTANT**: Copy and save the key immediately - it's shown only once!

The key format is: `rk_<base64>`

## Step 4: Use Your API Key

### Option A: SDK (Recommended)

```bash
npm install @settler/sdk
```

```typescript
import Settler from '@settler/sdk';

const client = new Settler({
  apiKey: 'rk_your_api_key_here',
  baseUrl: 'https://api.settler.io',
});

// List your API keys
const keys = await client.console.listApiKeys();
console.log(`You have ${keys.data.length} API keys`);

// Get usage stats
const usage = await client.console.getUsage(7); // Last 7 days
console.log(`Total calls: ${usage.summary.totalCalls}`);
```

### Option B: CLI

```bash
npm install -g @settler/cli

export SETTLER_API_KEY=rk_your_api_key_here

# List API keys
settler console api-keys list

# Get usage summary
settler console usage summary --days 7

# Health check
settler console health
```

### Option C: Direct API Calls

```bash
# List API keys
curl -H "X-API-Key: rk_your_api_key" \
  https://api.settler.io/api/console/api-keys

# Get usage
curl -H "X-API-Key: rk_your_api_key" \
  "https://api.settler.io/api/console/usage?days=7"
```

## Step 5: Explore Console Features

### Usage Analytics

1. Navigate to `/console/usage`
2. View your API usage statistics
3. Filter by time range (7/30/90 days)
4. See breakdown by service and operation

### Receipt Browser

1. Navigate to `/console/receipts`
2. View parsed receipts (if any)
3. Click "View" to see details
4. Check confidence scores and parsed items

### Feature Flags

1. Navigate to `/console/feature-flags`
2. View your feature flags
3. Toggle flags per environment
4. Test flag evaluations

### Live Activity Feed

The Console overview shows a live activity feed:
- Recent operations
- Activity types
- Status indicators
- Auto-refreshes every 10 seconds

## Next Steps

### Create a Reconciliation Job

```typescript
const job = await client.jobs.create({
  name: 'My First Job',
  source: {
    adapter: 'shopify',
    config: { /* ... */ },
  },
  target: {
    adapter: 'stripe',
    config: { /* ... */ },
  },
  rules: {
    matching: [
      { field: 'order_id', type: 'exact' },
      { field: 'amount', type: 'exact', tolerance: 0.01 },
    ],
  },
});
```

### Parse a Receipt

```typescript
const receipt = await client.receipts.parse({
  file: receiptFile, // File or Buffer
});
```

### Use Feature Flags

```typescript
const flag = await client.flags.evaluate({
  key: 'my-feature-flag',
  environment: 'production',
});
```

## Integration Examples

### SDK + Console

```typescript
// Create API key via SDK
const newKey = await client.console.createApiKey({
  name: 'SDK Generated Key',
});

// Use it immediately
const newClient = new Settler({ apiKey: newKey.key });
```

### CLI + Console

```bash
# Create key via CLI
settler console api-keys create --name "CLI Key"

# Use it
export SETTLER_API_KEY=rk_new_key
settler jobs list
```

### Console UI

Just use the web interface at `/console` - no code needed!

## Troubleshooting

### Can't Access Console

- Verify you're signed in
- Check Supabase auth is working
- Verify environment variables are set

### API Key Not Working

- Check key format: `rk_...`
- Verify key is not revoked
- Check scopes include required permissions
- Verify API endpoint URL

### SDK/CLI Errors

- Verify API key is set correctly
- Check network connectivity
- Verify base URL is correct
- Review error messages

## Resources

- [Console Complete Guide](CONSOLE_COMPLETE.md)
- [SDK/CLI/Console Integration](SDK_CLI_CONSOLE_INTEGRATION.md)
- [Getting Started Guide](GETTING_STARTED.md) (this document)
- [API Reference](api.md)
- [Architecture](ARCHITECTURE.md)

## Support

- 📖 [Documentation](https://docs.settler.io)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [Issue Tracker](https://github.com/settler/settler/issues)
- 📧 [Email Support](mailto:support@settler.io)
