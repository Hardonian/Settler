# Webhooks Documentation

Complete guide to Settler webhooks for external developers.

## Overview

Settler webhooks allow you to receive real-time notifications about events in your reconciliation jobs. Webhooks are delivered via HTTP POST requests to your specified endpoint with HMAC signature verification.

## Event Types

All available webhook events are listed in the [Event Registry](#event-registry). You can discover available events programmatically:

```bash
curl https://api.settler.io/api/v1/webhooks/events \
  -H "X-API-Key: rk_your_api_key"
```

### Common Events

- `ingestion.completed` - Data ingestion finished successfully
- `reconciliation.completed` - Reconciliation job finished
- `reconciliation.failed` - Reconciliation job failed
- `job.run.completed` - Job run finished
- `export.completed` - Export finished

See the [Event Registry](#event-registry) for the complete list.

## Creating Webhooks

### Create a Webhook Subscription

```bash
curl -X POST https://api.settler.io/api/v1/webhooks \
  -H "X-API-Key: rk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/settler",
    "events": [
      "reconciliation.completed",
      "reconciliation.failed"
    ]
  }'
```

**Response:**

```json
{
  "data": {
    "id": "webhook_123",
    "url": "https://your-app.com/webhooks/settler",
    "events": ["reconciliation.completed", "reconciliation.failed"],
    "status": "active",
    "secret": "whsec_abc123...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Important:** Store the `secret` securely - you'll need it to verify webhook signatures.

### Event Validation

Only public events can be subscribed to. Invalid event types will be rejected:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "All events must be valid public event types",
  "details": {
    "events": ["invalid.event.type"]
  }
}
```

## Receiving Webhooks

### Webhook Payload Structure

All webhooks follow this structure:

```json
{
  "id": "evt_1234567890",
  "type": "reconciliation.completed",
  "data": {
    "jobId": "job_abc123",
    "summary": {
      "matched": 1250,
      "unmatchedSource": 5,
      "unmatchedTarget": 3,
      "accuracy": 99.4
    },
    "completedAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### HTTP Headers

Each webhook includes these headers:

- `X-Settler-Signature` - HMAC-SHA256 signature
- `X-Settler-Timestamp` - Unix timestamp (seconds)
- `X-Settler-Event-Type` - Event type (e.g., `reconciliation.completed`)
- `X-Settler-Event-ID` - Unique event ID
- `Content-Type` - `application/json`

## Signature Verification

**Critical:** Always verify webhook signatures to ensure requests are from Settler.

### Verification Algorithm

1. Extract `X-Settler-Signature` and `X-Settler-Timestamp` headers
2. Concatenate timestamp + "." + raw JSON body
3. Compute HMAC-SHA256 using your webhook secret
4. Compare with signature header (use timing-safe comparison)

### Example Implementation

**Node.js:**

```javascript
const crypto = require("crypto");

function verifyWebhookSignature(payload, signature, timestamp, secret) {
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// In your webhook handler
app.post("/webhooks/settler", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-settler-signature"];
  const timestamp = req.headers["x-settler-timestamp"];
  const secret = process.env.SETTLER_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body.toString(), signature, timestamp, secret)) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body);
  // Process event...

  res.status(200).send("OK");
});
```

**Python:**

```python
import hmac
import hashlib
import time

def verify_webhook_signature(payload, signature, timestamp, secret):
    signed_payload = f"{timestamp}.{payload}"
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

# In your webhook handler
@app.route('/webhooks/settler', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Settler-Signature')
    timestamp = request.headers.get('X-Settler-Timestamp')
    secret = os.environ['SETTLER_WEBHOOK_SECRET']

    if not verify_webhook_signature(
        request.data.decode('utf-8'),
        signature,
        timestamp,
        secret
    ):
        return 'Invalid signature', 401

    event = request.json
    # Process event...

    return 'OK', 200
```

### Timestamp Validation

Prevent replay attacks by validating timestamps:

```javascript
const timestamp = parseInt(req.headers["x-settler-timestamp"]);
const currentTime = Math.floor(Date.now() / 1000);
const timeDiff = Math.abs(currentTime - timestamp);

if (timeDiff > 300) {
  // 5 minutes
  return res.status(401).send("Request timestamp too old");
}
```

## Retry Logic

Settler automatically retries failed webhook deliveries with exponential backoff:

- **Initial delay:** 1 second
- **Max delay:** 1 hour
- **Max attempts:** 5
- **Backoff:** 2^n seconds (1s, 2s, 4s, 8s, 16s)

### Response Requirements

Your endpoint must:

1. Return HTTP 200-299 for success
2. Return HTTP 4xx/5xx for failure (triggers retry)
3. Respond within 10 seconds (timeout)

### Idempotency

Webhooks may be delivered multiple times. Make your handler idempotent:

```javascript
// Use event ID to prevent duplicate processing
const processedEvents = new Set();

app.post("/webhooks/settler", async (req, res) => {
  const event = req.body;

  if (processedEvents.has(event.id)) {
    return res.status(200).send("Already processed");
  }

  // Process event...
  await processEvent(event);
  processedEvents.add(event.id);

  res.status(200).send("OK");
});
```

## Event Registry

### List All Events

```bash
curl https://api.settler.io/api/v1/webhooks/events \
  -H "X-API-Key: rk_your_api_key"
```

**Response:**

```json
{
  "data": [
    {
      "type": "reconciliation.completed",
      "description": "Triggered when reconciliation completes successfully",
      "schema": {
        "type": "object",
        "properties": {
          "jobId": { "type": "string" },
          "summary": {
            "type": "object",
            "properties": {
              "matched": { "type": "number" },
              "unmatchedSource": { "type": "number" },
              "unmatchedTarget": { "type": "number" },
              "accuracy": { "type": "number" }
            }
          },
          "completedAt": { "type": "string", "format": "date-time" }
        },
        "required": ["jobId", "summary", "completedAt"]
      },
      "since": "v1.0.0"
    }
  ],
  "count": 20
}
```

### Get Event Details

```bash
curl https://api.settler.io/api/v1/webhooks/events/reconciliation.completed \
  -H "X-API-Key: rk_your_api_key"
```

## Managing Webhooks

### List Webhooks

```bash
curl https://api.settler.io/api/v1/webhooks \
  -H "X-API-Key: rk_your_api_key"
```

### Delete Webhook

```bash
curl -X DELETE https://api.settler.io/api/v1/webhooks/webhook_123 \
  -H "X-API-Key: rk_your_api_key"
```

## Testing Webhooks

### Test Signature Generation

```bash
curl -X POST https://api.settler.io/api/v1/webhooks/test \
  -H "X-API-Key: rk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {"test": "data"},
    "secret": "your_webhook_secret"
  }'
```

### Verify Signature

```bash
curl -X POST https://api.settler.io/api/v1/webhooks/verify \
  -H "X-API-Key: rk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": "{\"test\":\"data\"}",
    "signature": "abc123...",
    "timestamp": "1234567890",
    "secret": "your_webhook_secret"
  }'
```

## Best Practices

1. **Always verify signatures** - Never trust unsigned requests
2. **Validate timestamps** - Prevent replay attacks
3. **Make handlers idempotent** - Handle duplicate deliveries
4. **Respond quickly** - Return 200 immediately, process async
5. **Log events** - Track all webhook deliveries for debugging
6. **Monitor failures** - Set up alerts for repeated failures
7. **Use HTTPS** - Webhook URLs must use HTTPS
8. **Store secrets securely** - Never commit secrets to code

## Error Handling

### Common Errors

**401 Unauthorized** - Invalid signature or missing timestamp

**400 Bad Request** - Invalid event types or malformed request

**429 Too Many Requests** - Rate limit exceeded

**500 Internal Server Error** - Settler service error (will retry)

## Rate Limits

Webhook delivery is rate-limited per webhook endpoint:

- **Default:** 100 deliveries per minute
- **Burst:** Up to 200 deliveries per minute
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Support

- **Documentation:** [docs.settler.io/webhooks](https://docs.settler.io/webhooks)
- **SDK:** `npm install @settler/sdk`
- **Support:** support@settler.io
