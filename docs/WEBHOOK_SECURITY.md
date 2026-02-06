# Webhook Security Threat Model

## Executive Summary

This document outlines the threat model for Settler's webhook system and the security controls implemented to protect against common attack vectors. Webhooks represent a critical attack surface as they receive authenticated requests from external systems and trigger business actions.

## Threat Model Overview

### System Context

```
External Providers (Stripe, Shopify, PayPal, etc.)
        │
        ▼
    ┌─────────────────────────────────────────┐
    │     Webhook Receiver (API Endpoint)      │
    │  ┌─────────────────────────────────────┐│
    │  │  • Signature Verification           ││
    │  │  • Timestamp Validation             ││
    │  │  • Idempotency Check               ││
    │  │  • Rate Limiting                   ││
    │  └─────────────────────────────────────┘│
    └─────────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────────┐
    │     Webhook Processing Queue           │
    │  ┌─────────────────────────────────────┐│
    │  │  • Event Deduplication              ││
    │  │  • Delivery Retry Logic            ││
    │  │  • Status Tracking                 ││
    │  └─────────────────────────────────────┘│
    └─────────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────────┐
    │     Business Logic Handlers            │
    │  ┌─────────────────────────────────────┐│
    │  │  • Deterministic Processing         ││
    │  │  • Transactional Updates           ││
    │  │  • Audit Logging                   ││
    │  └─────────────────────────────────────┘│
    └─────────────────────────────────────────┘
```

## Identified Threats & Mitigations

### 1. Signature Forgery Attack

**Threat**: Attacker sends fake webhook requests with forged signatures to trigger unauthorized actions.

**Impact**:

- Unauthorized data modifications
- Financial fraud
- Service disruption

**Mitigations**:

- ✅ HMAC-SHA256 signature verification using per-webhook secrets
- ✅ Timing-safe comparison (`crypto.timingSafeEqual`)
- ✅ Provider-specific verification (Stripe v1, Shopify HMAC, etc.)
- ✅ Reject requests without valid signatures

**Implementation**: `packages/api/src/utils/webhook-signature.ts`

**Test Coverage**: `packages/api/src/__tests__/webhooks/webhook-security.test.ts`

```typescript
// Example: Timing-safe verification
const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
```

### 2. Replay Attack

**Threat**: Attacker captures a valid webhook and re-sends it later to trigger duplicate actions.

**Impact**:

- Duplicate payments/orders
- Race conditions
- Data inconsistency

**Mitigations**:

- ✅ Timestamp validation (5-minute tolerance window)
- ✅ Idempotency key tracking with 24-hour expiration
- ✅ Duplicate request detection and rejection
- ✅ Event ID tracking for deduplication

**Implementation**:

- Timestamp check in `packages/api/src/routes/webhooks.ts`
- Idempotency in `packages/api/src/services/webhooks/webhook-service.ts`

**Configuration**:

```typescript
const TIMESTAMP_TOLERANCE = 300; // 5 minutes
const IDEMPOTENCY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
```

### 3. Duplicate Delivery (Legitimate Retries)

**Threat**: Provider retries delivery due to network issues, causing duplicate webhook processing.

**Impact**:

- Double-charging customers
- Duplicate database records
- Inconsistent state

**Mitigations**:

- ✅ Idempotency key storage with delivery status
- ✅ Skip side effects for duplicate events
- ✅ Return 200 OK for duplicates (provider stops retrying)
- ✅ Transactional processing

**Implementation**: See idempotency implementation in webhook-service.ts

```typescript
async function deliverWebhook(delivery: WebhookDelivery): Promise<boolean> {
  // Check idempotency first
  if (idempotencyKey && !options?.skipIdempotencyCheck) {
    const idempotencyCheck = await checkIdempotency(idempotencyKey, webhookId);
    if (!idempotencyCheck.shouldProcess) {
      logInfo("Skipping duplicate webhook delivery", { webhookId, idempotencyKey });
      return true; // Return success to prevent retries
    }
  }
}
```

### 4. Timing Attacks

**Threat**: Attacker extracts webhook secret by measuring response times.

**Impact**:

- Secret key exposure
- Complete system compromise

**Mitigations**:

- ✅ `crypto.timingSafeEqual()` for all signature comparisons
- ✅ Constant-time operations for critical comparisons
- ✅ No early returns on validation failures

### 5. Denial of Service (DoS)

**Threat**: Attacker floods webhook endpoints with requests.

**Impact**:

- Service unavailability
- Resource exhaustion
- Increased costs

**Mitigations**:

- ✅ Rate limiting (100 requests/minute per adapter/IP)
- ✅ Request size limits
- ✅ Connection timeouts (10s)
- ✅ Request body validation

**Implementation**: Express rate limiter in routes/webhooks.ts

```typescript
const webhookReceiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Per adapter per IP
  keyGenerator: (req) => `webhook:${req.params.adapter}:${req.ip}`,
});
```

### 6. SSRF via Webhook URLs

**Threat**: Attacker configures webhooks to point to internal infrastructure.

**Impact**:

- Internal network scanning
- Access to metadata endpoints
- Service compromise

**Mitigations**:

- ✅ HTTPS-only URLs required
- ✅ Block private IP ranges (10.x, 192.168.x, 172.16-31.x)
- ✅ Block localhost
- ✅ DNS resolution validation

**Implementation**: `validateExternalUrl()` in routes/webhooks.ts

### 7. Log Injection

**Threat**: Malicious webhook data contains log injection payloads.

**Impact**:

- Log corruption
- Log forging
- Misleading audit trails

**Mitigations**:

- ✅ Structured logging with proper escaping
- ✅ Limit log field sizes
- ✅ Separate audit logs from application logs
- ✅ Don't log raw webhook bodies

### 8. Race Conditions

**Threat**: Concurrent webhook processing causes inconsistent state.

**Impact**:

- Data corruption
- Transaction failures
- Lost updates

**Mitigations**:

- ✅ Database transactions for all state modifications
- ✅ Optimistic locking with version fields
- ✅ Deterministic event processing
- ✅ Idempotency prevents duplicate writes

## Security Controls Summary

| Threat             | Severity | Control                           | Implementation       |
| ------------------ | -------- | --------------------------------- | -------------------- |
| Signature Forgery  | Critical | HMAC-SHA256 + timing-safe compare | webhook-signature.ts |
| Replay Attack      | High     | Timestamp validation (5min)       | routes/webhooks.ts   |
| Duplicate Delivery | High     | Idempotency keys                  | webhook-service.ts   |
| Timing Attacks     | Medium   | Constant-time comparison          | webhook-signature.ts |
| DoS                | Medium   | Rate limiting + timeouts          | routes/webhooks.ts   |
| SSRF               | High     | URL validation                    | SSRFProtection.ts    |
| Log Injection      | Low      | Structured logging                | logger.ts            |
| Race Conditions    | Medium   | Database transactions             | Prisma client        |

## Audit & Monitoring

### Security Events Logged

1. **Webhook Received** - Timestamp, adapter, IP (masked)
2. **Signature Validation** - Success/failure, adapter
3. **Idempotency Check** - New vs duplicate, key
4. **Replay Attempt** - Timestamp age, rejection reason
5. **Processing Result** - Success/failure, duration
6. **Retry Attempts** - Attempt number, reason

### Alerting Thresholds

- ❌ > 10 signature failures/hour → Security alert
- ❌ > 5 replay attempts/hour → Security alert
- ❌ > 50 duplicate deliveries/hour → Review provider configuration
- ❌ Processing time > 30s → Performance alert

## Compliance Considerations

### PCI-DSS (If Handling Card Data)

- ✅ Webhook secrets stored encrypted at rest
- ✅ No PAN logging in webhook payloads
- ✅ Signature verification required
- ✅ Timeout limits enforced

### SOC 2

- ✅ Audit trail of all webhook activity
- ✅ Tamper-evident logging
- ✅ Access controls on webhook configuration
- ✅ Encryption in transit (HTTPS + signatures)

## Testing Strategy

### Automated Tests

1. **Unit Tests**: Signature verification, timestamp validation, idempotency checks
2. **Integration Tests**: Full webhook flow with test providers
3. **Security Tests**: Fuzzing, invalid signatures, replay attacks
4. **Load Tests**: DoS resistance, retry handling

### Test Tools

```bash
# Run webhook security tests
pnpm test --filter @settler/api --testPathPattern=webhook-security

# Run webhook simulator
node scripts/webhook-simulator.ts --test=all

# Start mock server for testing
node scripts/webhook-simulator.ts server --port=3001
```

## Incident Response

### Suspected Webhook Attack

1. **Immediate Actions**:
   - Block suspicious IPs via rate limiter
   - Rotate webhook secrets
   - Enable enhanced logging

2. **Investigation**:
   - Review audit logs for patterns
   - Check for successful signature bypass
   - Identify affected webhooks

3. **Recovery**:
   - Re-process missed legitimate webhooks
   - Revert any unauthorized changes
   - Update security controls

### Data Breach Procedure

If webhook compromise leads to data exposure:

1. Contain the breach (disable affected webhooks)
2. Assess scope (what data was accessed)
3. Notify affected parties (per compliance requirements)
4. Rotate all secrets and keys
5. Enhanced monitoring for 90 days

## References

- [Stripe Webhook Signatures](https://stripe.com/docs/webhooks/signatures)
- [Shopify Webhook Verification](https://shopify.dev/docs/apps/webhooks#verify-webhooks)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [CWE-307: Improper Restriction of Excessive Authentication Attempts](https://cwe.mitre.org/data/versions/307.html)
- [CWE-347: Improper Verification of Cryptographic Signature](https://cwe.mitre.org/data/versions/347.html)

## Revision History

| Version | Date       | Author        | Changes              |
| ------- | ---------- | ------------- | -------------------- |
| 1.0     | 2024-01-15 | Security Team | Initial threat model |

---

**Document Classification**: Internal Use - Security Sensitive  
**Last Review**: 2024-01-15  
**Next Review**: 2024-04-15
