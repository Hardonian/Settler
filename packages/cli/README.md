# Settler CLI

Command-line tool for managing Settler resources and interacting with the API.

## Installation

```bash
npm install -g @settler/cli
# or
npm install @settler/cli --save-dev
```

## Quick Start

### 1. Set API Key

```bash
export SETTLER_API_KEY=rk_your_api_key_here
export SETTLER_BASE_URL=https://api.settler.io  # Optional, defaults to production
```

### 2. Use Commands

```bash
# Jobs
settler jobs list
settler jobs create --name "My Job"

# Console (API Keys, Usage, etc.)
settler console api-keys list
settler console usage summary --days 7
settler console health

# Receipts
settler receipts parse path/to/receipt.pdf

# Reports
settler reports get <job-id>
```

## Console Commands

The CLI includes full Console management:

### API Keys

```bash
# List all API keys
settler console api-keys list

# Create a new API key
settler console api-keys create --name "My Key" --scopes "read,write"

# Revoke an API key
settler console api-keys revoke <key-id>
```

### Usage Statistics

```bash
# Get usage summary (last 7 days)
settler console usage summary

# Get usage for specific days
settler console usage summary --days 30
```

### Health Check

```bash
# Check Console health
settler console health
```

## All Commands

### Jobs

```bash
settler jobs list                    # List all jobs
settler jobs create [options]       # Create a job
settler jobs get <id>               # Get job details
settler jobs run <id>               # Run a job
settler jobs delete <id>            # Delete a job
```

### Reports

```bash
settler reports list                # List reports
settler reports get <job-id>        # Get report for job
```

### Webhooks

```bash
settler webhooks list               # List webhooks
settler webhooks create [options]   # Create webhook
settler webhooks delete <id>        # Delete webhook
```

### Adapters

```bash
settler adapters list               # List available adapters
settler adapters get <id>           # Get adapter details
```

### Receipts

```bash
settler receipts parse <file>       # Parse a receipt
```

### Console

```bash
settler console api-keys list        # List API keys
settler console api-keys create      # Create API key
settler console api-keys revoke <id> # Revoke API key
settler console usage summary        # Usage statistics
settler console health               # Health check
```

## Configuration

### Environment Variables

- `SETTLER_API_KEY` - Your API key (required)
- `SETTLER_BASE_URL` - API base URL (optional, default: `https://api.settler.io`)

### Command Options

```bash
# Use API key from command line
settler --api-key rk_xxx jobs list

# Use custom base URL
settler --base-url https://staging.api.settler.io jobs list

# Verbose logging
settler --verbose jobs list
```

## Examples

### Create and Run a Job

```bash
# Create a reconciliation job
settler jobs create \
  --name "Shopify-Stripe Reconciliation" \
  --source-adapter shopify \
  --target-adapter stripe

# Run the job
settler jobs run <job-id>

# Check the report
settler reports get <job-id>
```

### Manage API Keys

```bash
# List all keys
settler console api-keys list

# Create a new key
settler console api-keys create --name "CI/CD Key"

# Revoke old key
settler console api-keys revoke <old-key-id>
```

### Monitor Usage

```bash
# Check usage for last 7 days
settler console usage summary

# Check usage for last 30 days
settler console usage summary --days 30
```

## Integration with SDK

The CLI uses the Settler SDK internally, ensuring consistency with SDK usage. All Console commands use the same APIs as the SDK and Console UI.

See [SDK/CLI/Console Integration Guide](../../docs/SDK_CLI_CONSOLE_INTEGRATION.md) for details.

## Error Handling

The CLI provides clear error messages:
- **401**: Authentication failed - check your API key
- **403**: Permission denied - check API key scopes
- **404**: Resource not found
- **Network errors**: Connection issues or timeouts

## Output Format

- **Success**: Green checkmarks and formatted output
- **Errors**: Red error messages with details
- **Warnings**: Yellow warnings for non-critical issues

## Development

### Local Development

```bash
# Clone repository
git clone https://github.com/settler/settler.git
cd settler

# Install dependencies
npm install

# Build CLI
cd packages/cli
npm run build

# Link globally for testing
npm link

# Use locally
settler --help
```

## Documentation

- [SDK/CLI/Console Integration](../../docs/SDK_CLI_CONSOLE_INTEGRATION.md)
- [Console Complete Guide](../../docs/CONSOLE_COMPLETE.md)
- [API Reference](../../docs/api.md)

## Support

- 📖 [Documentation](https://docs.settler.io)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [Issue Tracker](https://github.com/settler/settler/issues)
