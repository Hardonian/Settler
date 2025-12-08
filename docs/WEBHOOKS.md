# Webhooks

Settler.dev sends webhooks to notify your application of important events.

## Setup

1. Create a webhook endpoint in your application
2. Register the webhook URL via API
3. Verify webhook signatures

## Events

### recon.completed

Sent when a reconciliation job completes successfully.

```json
{
  "id": "evt_123",
  "type": "recon.completed",
  "timestamp": "2025-01-20T00:00:00Z",
  "data": {
    "reconJobId": "job_123",
    "reconResultId": "result_456",
    "status": "completed",
    "summary": {
      "matchedCount": 100,
      "unmatchedSourceCount": 5,
      "unmatchedTargetCount": 3
    }
  }
}
```

### recon.failed

Sent when a reconciliation job fails.

```json
{
  "id": "evt_124",
  "type": "recon.failed",
  "timestamp": "2025-01-20T00:00:00Z",
  "data": {
    "reconJobId": "job_123",
    "reconResultId": "result_456",
    "status": "failed",
    "error": "Error message"
  }
}
```

### drift.detected

Sent when schema drift is detected.

```json
{
  "id": "evt_125",
  "type": "drift.detected",
  "timestamp": "2025-01-20T00:00:00Z",
  "data": {
    "reconJobId": "job_123",
    "driftType": "schema_drift",
    "fieldPath": "amount",
    "expectedType": "number",
    "actualType": "string",
    "severity": "error"
  }
}
```

## Signature Verification

All webhooks include an `X-Settler-Signature` header with HMAC-SHA256 signature.

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-settler-signature'];
  const isValid = verifyWebhook(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  res.status(200).send('OK');
});
```

## Retry Logic

Webhooks are retried with exponential backoff:
- 1st retry: 1 second
- 2nd retry: 2 seconds
- 3rd retry: 4 seconds
- 4th retry: 8 seconds
- 5th retry: 16 seconds

Maximum 5 retry attempts.

## Best Practices

1. **Idempotency:** Make your webhook handlers idempotent
2. **Quick Response:** Respond with 200 OK quickly, process asynchronously
3. **Error Handling:** Return appropriate status codes
4. **Logging:** Log all webhook deliveries for debugging

---

**For webhook management, see [API_REFERENCE.md](./API_REFERENCE.md#webhooks)**
