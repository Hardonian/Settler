# Troubleshooting Guide

**Common issues and solutions for Settler.dev**

---

## Quick Diagnosis

### Issue: Can't create reconciliation job

**Symptoms:**

- API returns 400 or 401 error
- Job creation fails

**Solutions:**

1. **Check API Key**

   ```bash
   echo $SETTLER_API_KEY
   # Should start with sk_live_ or sk_test_
   ```

2. **Verify Job Configuration**
   - Check adapter names are correct (lowercase: "stripe", "shopify", etc.)
   - Verify API keys for source/target platforms are valid
   - Check matching rules are properly formatted

3. **Check Plan Limits**
   - Free tier: 1,000 reconciliations/month
   - Verify you haven't exceeded limits

---

### Issue: Job execution fails

**Symptoms:**

- Job status shows "failed"
- No matches found
- Error messages in job logs

**Solutions:**

1. **Check Adapter Connection**

   ```typescript
   // Test adapter connection
   const testResult = await settler.adapters.test({
     adapter: "stripe",
     config: { apiKey: process.env.STRIPE_KEY },
   });

   if (!testResult.success) {
     console.error("Adapter connection failed:", testResult.error);
   }
   ```

2. **Verify Data Availability**
   - Check source platform has transactions in date range
   - Check target platform has corresponding transactions
   - Verify date ranges overlap

3. **Review Matching Rules**
   - Ensure field names match actual data fields
   - Check tolerance values are appropriate
   - Verify date ranges allow for processing delays

4. **Check Error Logs**
   ```typescript
   const execution = await settler.jobs.getExecution(jobId);
   if (execution.status === "failed") {
     console.error("Execution errors:", execution.errors);
   }
   ```

---

### Issue: High number of unmatched transactions

**Symptoms:**

- Low match rate (< 80%)
- Many exceptions in queue
- Reconciliation accuracy is low

**Solutions:**

1. **Review Matching Rules**
   - Use exact match on unique identifiers (order_id, transaction_id)
   - Add amount matching with appropriate tolerance
   - Consider date range matching for processing delays

2. **Check Data Quality**

   ```typescript
   // Inspect source data
   const sourceData = await settler.adapters.fetch({
     adapter: "shopify",
     config: {
       /* ... */
     },
     dateRange: { start: "2026-01-01", end: "2026-01-31" },
   });

   // Check for missing fields, typos, formatting issues
   console.log("Sample source data:", sourceData[0]);
   ```

3. **Adjust Matching Tolerance**

   ```typescript
   rules: {
     matching: [
       { field: "order_id", type: "exact" },
       { field: "amount", type: "range", tolerance: 0.01 }, // Increase if needed
       { field: "date", type: "range", days: 2 }, // Increase if processing delays
     ];
   }
   ```

4. **Use Fuzzy Matching for Text Fields**
   ```typescript
   rules: {
     matching: [{ field: "customer_name", type: "fuzzy", threshold: 0.8 }];
   }
   ```

---

### Issue: Rate limit errors (429)

**Symptoms:**

- API returns 429 Too Many Requests
- Requests fail with rate limit message

**Solutions:**

1. **Check Current Rate Limits**

   ```typescript
   // Rate limit info in response headers
   const response = await fetch("/api/v1/jobs", {
     headers: { Authorization: `Bearer ${apiKey}` },
   });

   console.log("Rate limit:", response.headers.get("X-RateLimit-Limit"));
   console.log("Remaining:", response.headers.get("X-RateLimit-Remaining"));
   console.log("Reset at:", response.headers.get("X-RateLimit-Reset"));
   ```

2. **Implement Rate Limit Handling**

   ```typescript
   async function handleRateLimit(fn: () => Promise<any>) {
     try {
       return await fn();
     } catch (error) {
       if (error.status === 429) {
         const resetAt = new Date(error.details.resetAt);
         const waitTime = resetAt.getTime() - Date.now();

         if (waitTime > 0) {
           console.log(`Rate limit exceeded. Waiting ${waitTime}ms`);
           await new Promise((resolve) => setTimeout(resolve, waitTime));
           return await fn(); // Retry
         }
       }
       throw error;
     }
   }
   ```

3. **Reduce Request Frequency**
   - Use webhooks instead of polling
   - Batch requests when possible
   - Cache results when appropriate

4. **Upgrade Plan**
   - Free: 100 requests / 15 minutes
   - Commercial: 2,000 requests / 15 minutes
   - Enterprise: Custom limits

---

### Issue: PDF export not working

**Symptoms:**

- PDF export returns JSON instead of file
- Export endpoint returns error

**Solutions:**

1. **Check Export Format**

   ```typescript
   const exportResult = await settler.exports.create({
     jobId: "job_123",
     format: "pdf", // Must be lowercase
   });
   ```

2. **Verify Job Has Data**
   - Ensure job has completed successfully
   - Check job has matches or unmatched transactions
   - Verify date range includes execution data

3. **Check File Size**
   - Large reports may timeout
   - Consider using CSV for very large datasets
   - Use pagination for large exports

4. **Alternative: Use CSV Export**
   ```typescript
   const csvExport = await settler.exports.create({
     jobId: "job_123",
     format: "csv", // More reliable for large datasets
   });
   ```

---

### Issue: Multi-currency reconciliation not working

**Symptoms:**

- Currency conversion fails
- FX rates not available
- Amounts don't match after conversion

**Solutions:**

1. **Sync FX Rates**

   ```typescript
   // Sync rates from external provider
   await settler.currency.syncRates({
     baseCurrency: "USD",
     date: "2026-01-15", // Optional: historical date
   });
   ```

2. **Manually Enter FX Rates**

   ```typescript
   // If automatic sync fails, enter rates manually
   await settler.currency.recordRate({
     fromCurrency: "EUR",
     toCurrency: "USD",
     rate: 1.08,
     date: "2026-01-15",
   });
   ```

3. **Check Base Currency**

   ```typescript
   const baseCurrency = await settler.currency.getBaseCurrency();
   console.log("Base currency:", baseCurrency);
   ```

4. **Verify Currency Codes**
   - Use ISO 4217 codes (USD, EUR, GBP, etc.)
   - Check currency codes match in source and target data
   - Ensure currency field is populated in transactions

---

### Issue: Webhooks not received

**Symptoms:**

- Webhook events not arriving
- Webhook delivery fails

**Solutions:**

1. **Verify Webhook URL**
   - Check URL is publicly accessible (not localhost)
   - Verify HTTPS is used (required for production)
   - Test endpoint manually

2. **Check Webhook Signature**

   ```typescript
   import crypto from "crypto";

   function verifyWebhookSignature(signature: string, payload: string, secret: string): boolean {
     const [timestamp, hash] = signature.split(",");
     const [t, v1] = hash.split("=");

     const expected = crypto
       .createHmac("sha256", secret)
       .update(`${timestamp.split("=")[1]}.${payload}`)
       .digest("hex");

     return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
   }
   ```

3. **Check Webhook Delivery Logs**

   ```typescript
   const webhook = await settler.webhooks.get(webhookId);
   console.log("Delivery history:", webhook.deliveries);
   ```

4. **Verify Endpoint Returns 2xx**
   - Webhook endpoint must return 200-299 status
   - Non-2xx responses trigger retries
   - 4xx responses stop retries (permanent failure)

5. **Check Firewall/Network**
   - Ensure Settler IPs are whitelisted (if using firewall)
   - Check network connectivity
   - Verify SSL certificate is valid

---

### Issue: Slow reconciliation performance

**Symptoms:**

- Jobs take long time to complete
- Timeout errors
- High API latency

**Solutions:**

1. **Reduce Data Volume**
   - Use smaller date ranges
   - Process in batches
   - Filter data before reconciliation

2. **Optimize Matching Rules**
   - Use exact matches first (fastest)
   - Limit fuzzy matching (slower)
   - Reduce number of matching rules

3. **Check Adapter Performance**

   ```typescript
   // Test adapter response time
   const start = Date.now();
   await settler.adapters.fetch({
     /* ... */
   });
   const duration = Date.now() - start;
   console.log(`Adapter fetch took ${duration}ms`);
   ```

4. **Use Scheduled Jobs**
   - Run during off-peak hours
   - Process incrementally
   - Avoid large batch processing

5. **Contact Support**
   - If consistently slow, contact support
   - Provide job ID and execution ID
   - Include performance metrics

---

### Issue: Authentication errors

**Symptoms:**

- 401 Unauthorized errors
- API key validation fails

**Solutions:**

1. **Verify API Key Format**

   ```bash
   # Should start with sk_live_ or sk_test_
   echo $SETTLER_API_KEY | grep -E '^sk_(live|test)_'
   ```

2. **Check API Key Status**
   - Verify key hasn't been revoked
   - Check key hasn't expired
   - Ensure key is for correct environment (live vs test)

3. **Regenerate API Key**

   ```typescript
   // In dashboard: Settings → API Keys → Regenerate
   // Or via API (if you have admin access)
   ```

4. **Check Authorization Header**

   ```typescript
   // Correct format
   headers: {
     'Authorization': `Bearer ${apiKey}`
   }

   // NOT: 'Authorization': apiKey
   // NOT: 'X-API-Key': apiKey
   ```

---

### Issue: Data not matching expected format

**Symptoms:**

- Adapter returns unexpected data structure
- Field names don't match
- Missing required fields

**Solutions:**

1. **Inspect Adapter Response**

   ```typescript
   const data = await settler.adapters.fetch({
     adapter: "stripe",
     config: { apiKey: process.env.STRIPE_KEY },
   });

   console.log("Sample data:", JSON.stringify(data[0], null, 2));
   ```

2. **Check Field Mappings**

   ```typescript
   // Verify field names in matching rules match actual data
   rules: {
     matching: [
       { field: "order_id", type: "exact" }, // Must exist in data
     ];
   }
   ```

3. **Use Custom Field Mappings**
   ```typescript
   source: {
     adapter: "shopify",
     config: {
       apiKey: "...",
       fieldMappings: {
         order_id: "order_number", // Map to actual field name
         amount: "total_price"
       }
     }
   }
   ```

---

## Getting Help

### Before Contacting Support

1. **Check Documentation**
   - [API Quick Start](./api-quick-start.md)
   - [Error Handling Guide](./error-handling.md)
   - [Matching Rules](./matching-rules.md)

2. **Search Discord**
   - [discord.gg/settler](https://discord.gg/settler)
   - Search for similar issues
   - Ask community

3. **Check GitHub Issues**
   - [github.com/settler/settler/issues](https://github.com/settler/settler/issues)
   - Search existing issues
   - Create new issue if needed

### When Contacting Support

**Include:**

- Error message and code
- Trace ID (from error response)
- Job ID (if applicable)
- Steps to reproduce
- Expected vs actual behavior
- API key (masked: `sk_live_...xxxx`)

**Email:** [support@settler.io](mailto:support@settler.io)

---

## Common Error Messages

### "Job not found"

- **Cause:** Job ID incorrect or job deleted
- **Fix:** Verify job ID, check job exists in dashboard

### "Adapter connection failed"

- **Cause:** Invalid adapter API key or network issue
- **Fix:** Verify adapter API key, check network connectivity

### "No FX rate available"

- **Cause:** FX rate not in database and provider fetch failed
- **Fix:** Sync FX rates or enter manually

### "Quota exceeded"

- **Cause:** Plan limit reached
- **Fix:** Upgrade plan or wait for next billing cycle

### "Rate limit exceeded"

- **Cause:** Too many API requests
- **Fix:** Wait for reset time, reduce request frequency

---

**Last Updated:** January 2026
