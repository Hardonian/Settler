# Troubleshooting Guide

Common issues and solutions for Settler API.

## Authentication Issues

### "Unauthorized" Error

**Problem:** API requests return 401 Unauthorized.

**Solutions:**

1. **Check API Key Format**
   ```bash
   # Correct format
   sk_live_1234567890abcdef
   
   # Wrong format
   rk_1234567890  # Old format
   ```

2. **Verify API Key in Header**
   ```bash
   curl -H "X-API-Key: sk_your_api_key" https://api.settler.io/api/v1/jobs
   ```

3. **Check Environment Variables**
   ```bash
   echo $SETTLER_API_KEY  # Should output your API key
   ```

### "Invalid Token" Error

**Problem:** JWT token is invalid or expired.

**Solutions:**

1. Generate a new token
2. Check token expiration time
3. Verify token secret matches server configuration

## Rate Limiting

### "Too Many Requests" Error

**Problem:** Receiving 429 status code.

**Solutions:**

1. **Check Rate Limit Headers**
   ```http
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset: 1640995200
   ```

2. **Implement Exponential Backoff**
   ```typescript
   async function requestWithRetry(fn: () => Promise<any>, retries = 3) {
     try {
       return await fn();
     } catch (error) {
       if (error.status === 429 && retries > 0) {
         await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
         return requestWithRetry(fn, retries - 1);
       }
       throw error;
     }
   }
   ```

3. **Use Multiple API Keys** (if allowed by your plan)

## Job Execution Issues

### Job Stuck in "Running" State

**Problem:** Job execution never completes.

**Solutions:**

1. **Check Job Logs**
   ```bash
   curl https://api.settler.io/api/v1/jobs/job_123/logs
   ```

2. **Verify Adapter Configuration**
   - Check API keys are valid
   - Verify adapter credentials
   - Test adapter connection separately

3. **Check Date Range**
   - Ensure date range is reasonable
   - Very large date ranges may timeout

### No Matches Found

**Problem:** Reconciliation finds zero matches.

**Solutions:**

1. **Review Matching Rules**
   ```typescript
   // Too strict
   rules: {
     matching: [
       { field: "order_id", type: "exact" },
       { field: "amount", type: "exact", tolerance: 0 }, // No tolerance
     ]
   }
   
   // Better
   rules: {
     matching: [
       { field: "order_id", type: "exact" },
       { field: "amount", type: "exact", tolerance: 0.01 }, // Allow small variance
     ]
   }
   ```

2. **Check Data Formats**
   - Verify currency codes match (USD vs US Dollar)
   - Check date formats
   - Ensure reference IDs are consistent

3. **Use Fuzzy Matching**
   ```typescript
   rules: {
     matching: [
       { field: "reference", type: "fuzzy", threshold: 0.8 },
     ]
   }
   ```

## Adapter Issues

### "Adapter Not Found" Error

**Problem:** Adapter ID doesn't exist.

**Solutions:**

1. **List Available Adapters**
   ```bash
   curl https://api.settler.io/api/v1/adapters
   ```

2. **Check Adapter Name**
   - Use exact adapter ID (case-sensitive)
   - Common adapters: `stripe`, `shopify`, `quickbooks`, `paypal`

### Adapter Connection Failed

**Problem:** Cannot connect to external platform.

**Solutions:**

1. **Verify Credentials**
   ```typescript
   // Test adapter connection
   const adapter = new StripeAdapter();
   await adapter.fetch({
     dateRange: { start: new Date(), end: new Date() },
     config: { apiKey: "sk_test_..." }
   });
   ```

2. **Check Network/Firewall**
   - Ensure API can reach external platform
   - Check for IP allowlisting requirements

3. **Verify API Permissions**
   - Some platforms require specific scopes
   - Check platform-specific documentation

## Webhook Issues

### Webhooks Not Received

**Problem:** Webhooks not being delivered.

**Solutions:**

1. **Verify Webhook URL**
   - Must be publicly accessible
   - Must accept POST requests
   - Should return 200 status code

2. **Check Webhook Secret**
   ```typescript
   // Verify webhook signature
   const signature = req.headers['x-settler-signature'];
   const isValid = verifyWebhookSignature(payload, signature, secret);
   ```

3. **Check Webhook Logs**
   ```bash
   curl https://api.settler.io/api/v1/webhooks/wh_123/logs
   ```

### Webhook Delivery Delayed

**Problem:** Webhooks arrive late.

**Solutions:**

1. **Normal Behavior**
   - Webhooks are queued and retried
   - High volume may cause delays
   - Check webhook status endpoint

2. **Implement Idempotency**
   ```typescript
   // Handle duplicate webhooks
   const processedIds = new Set();
   
   app.post('/webhooks', (req, res) => {
     const eventId = req.body.id;
     if (processedIds.has(eventId)) {
       return res.status(200).json({ received: true });
     }
     processedIds.add(eventId);
     // Process webhook...
   });
   ```

## SDK Issues

### TypeScript Errors

**Problem:** Type errors when using SDK.

**Solutions:**

1. **Update SDK Version**
   ```bash
   npm install @settler/sdk@latest
   ```

2. **Check TypeScript Version**
   ```bash
   npm install typescript@^5.3.0 --save-dev
   ```

3. **Import Types Correctly**
   ```typescript
   import Settler, { ReconciliationJob } from "@settler/sdk";
   ```

### SDK Not Found

**Problem:** Cannot import SDK.

**Solutions:**

1. **Install SDK**
   ```bash
   npm install @settler/sdk
   ```

2. **Check Package Scope**
   ```typescript
   // Correct
   import Settler from "@settler/sdk";
   
   // Wrong
   import Settler from "settler-sdk";
   ```

## Performance Issues

### Slow API Responses

**Problem:** API requests are slow.

**Solutions:**

1. **Check Date Range**
   - Smaller date ranges are faster
   - Use pagination for large datasets

2. **Use Async Operations**
   ```typescript
   // Trigger async job execution
   const execution = await client.jobs.run(jobId);
   
   // Poll for completion
   while (execution.status === 'running') {
     await sleep(5000);
     execution = await client.jobs.getExecution(execution.id);
   }
   ```

3. **Enable Caching**
   - Cache adapter configs
   - Cache report results when possible

## Getting Help

If you're still experiencing issues:

1. **Check Documentation**
   - [API Reference](./api.md)
   - [Adapters Guide](./adapters.md)

2. **Search Issues**
   - Check GitHub Issues for similar problems

3. **Create Issue**
   - Provide detailed error messages
   - Include code examples
   - Share relevant logs

4. **Contact Support**
   - Email: support@settler.io
   - Include your API key prefix (first 8 characters)

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format and validation |
| 401 | Unauthorized | Verify API key or token |
| 403 | Forbidden | Check API key permissions |
| 404 | Not Found | Verify resource ID exists |
| 429 | Rate Limited | Implement backoff, check limits |
| 500 | Server Error | Retry request, contact support |
