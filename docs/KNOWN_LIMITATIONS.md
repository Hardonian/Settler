# Known Limitations

**Last Updated:** 2025-01-20  
**Status:** Production Reality  
**Purpose:** Explicit documentation of constraints, failure conditions, and unsupported scenarios

## Overview

This document catalogs **known limitations** that affect Settler's behavior. These are not bugs—they are constraints that users must work around.

**Philosophy:** It is better to document limitations upfront than to surprise users later.

---

## System Limitations

### 1. Single-Region Deployment

**Limitation:** Settler operates from a single AWS region (us-east-1).

**Impact:**
- No automatic failover to other regions
- Latency increases for users outside the region
- Regional outages affect all users

**Workaround:**
- Use CDN for static assets (already implemented)
- Implement client-side retry logic
- Monitor regional health status

**Future:** Multi-region deployment is planned but not guaranteed.

---

### 2. Eventual Consistency

**Limitation:** Data consistency is eventual, not immediate.

**Impact:**
- Usage tracking may lag by minutes
- Webhook deliveries may be delayed
- Database reads may show stale data

**Workaround:**
- Poll for status updates if real-time data is required
- Use webhooks for eventual delivery (not real-time)
- Implement client-side caching with TTL

**Future:** Strong consistency may be added for critical operations (not guaranteed).

---

### 3. Rate Limiting Fallback

**Limitation:** Rate limiting falls back to in-memory storage if Redis is unavailable.

**Impact:**
- Rate limits reset on server restart
- Rate limits are per-instance (not shared across instances)
- Rate limits may be bypassed during Redis outages

**Workaround:**
- Monitor Redis health
- Implement client-side rate limiting as defense-in-depth
- Use API keys with lower rate limits for critical operations

**Future:** Persistent rate limiting may be added (not guaranteed).

---

### 4. Database Connection Limits

**Limitation:** PostgreSQL connection pool is limited (default: 20 connections).

**Impact:**
- High concurrency may exhaust connection pool
- Requests may fail with "too many connections" errors
- Connection pool exhaustion affects all tenants

**Workaround:**
- Implement request queuing on client side
- Use connection pooling in client applications
- Monitor connection pool metrics

**Future:** Connection pool scaling may be improved (not guaranteed).

---

### 5. File Size Limits

**Limitation:** File uploads are limited to 10MB per file.

**Impact:**
- Large receipts/files cannot be processed
- CSV imports are limited to 10MB
- Export files may be truncated

**Workaround:**
- Split large files into smaller chunks
- Use streaming APIs for large datasets
- Compress files before upload

**Future:** Larger file support may be added (not guaranteed).

---

## Service-Specific Limitations

### Receipts API

#### OCR Accuracy

**Limitation:** OCR accuracy varies by receipt format and image quality.

**Impact:**
- Low-quality images may produce incorrect data
- Uncommon receipt formats may fail parsing
- Handwritten receipts are not supported

**Workaround:**
- Pre-process images (enhance contrast, remove noise)
- Verify extracted data against source
- Use confidence scores to filter low-quality results

**Known Issues:**
- Receipts with complex layouts may fail
- Multi-language receipts may have lower accuracy
- Receipts with watermarks may be misread

---

#### Supported Formats

**Limitation:** Only PDF and common image formats (JPEG, PNG) are supported.

**Impact:**
- Other formats (TIFF, HEIC, etc.) are rejected
- Scanned PDFs may have lower accuracy than native PDFs

**Workaround:**
- Convert unsupported formats to JPEG/PNG before upload
- Use high-quality scans (300 DPI minimum)

**Future:** Additional formats may be added (not guaranteed).

---

### Feature Flags API

#### Cache Propagation Delay

**Limitation:** Feature flag changes may take up to 60 seconds to propagate.

**Impact:**
- Flag changes are not instant
- Users may see old flag values temporarily
- Flag overrides may not apply immediately

**Workaround:**
- Wait 60 seconds after flag changes before testing
- Use flag versioning to track changes
- Monitor flag evaluation logs

**Future:** Faster propagation may be added (not guaranteed).

---

#### Evaluation Limits

**Limitation:** Feature flag evaluations are rate-limited per API key.

**Impact:**
- High-frequency evaluations may be throttled
- Evaluations count toward usage quotas
- Excessive evaluations may trigger rate limits

**Workaround:**
- Cache flag values client-side (recommended TTL: 60 seconds)
- Batch flag evaluations when possible
- Monitor evaluation rates

**Future:** Higher limits may be added for enterprise plans (not guaranteed).

---

### Reconciliation Engine

#### Matching Accuracy

**Limitation:** Matching accuracy depends on data quality and matching rules.

**Impact:**
- Low-quality data may produce false matches
- Complex matching rules may be slow
- Unmatched transactions require manual review

**Workaround:**
- Normalize data before reconciliation
- Use confidence scores to filter matches
- Review unmatched transactions regularly

**Known Issues:**
- Fuzzy matching may produce false positives
- Date/time mismatches may prevent matching
- Currency conversion errors may affect matching

---

#### Processing Time

**Limitation:** Large reconciliation runs may take minutes or hours.

**Impact:**
- Real-time reconciliation is not possible
- Long-running jobs may timeout
- Resource-intensive runs may affect other tenants

**Workaround:**
- Split large datasets into smaller batches
- Use async processing with webhooks
- Monitor job status and retry on timeout

**Future:** Faster processing may be added (not guaranteed).

---

## Integration Limitations

### Stripe Integration

**Limitation:** Stripe webhook processing depends on Stripe's reliability.

**Impact:**
- Stripe outages affect billing operations
- Webhook deliveries may be delayed
- Subscription updates may lag

**Workaround:**
- Implement reconciliation jobs to sync Stripe data
- Monitor Stripe webhook delivery status
- Use Stripe API polling as fallback

**Known Issues:**
- Webhook signature verification may fail during Stripe updates
- Rate limiting may affect webhook processing
- Duplicate webhooks may cause idempotency issues

---

### Supabase Integration

**Limitation:** Database operations depend on Supabase's reliability.

**Impact:**
- Supabase outages affect all operations
- Connection pool limits may be exceeded
- RLS policies may be misconfigured

**Workaround:**
- Monitor Supabase health status
- Implement connection retry logic
- Verify RLS policies regularly

**Known Issues:**
- Service-role keys bypass RLS (documented risk)
- Connection pooling may be inefficient
- Database migrations may cause downtime

---

## Security Limitations

### API Key Security

**Limitation:** API keys are stored hashed but can be compromised if leaked.

**Impact:**
- Leaked API keys grant full access to tenant data
- Key rotation requires manual intervention
- Revoked keys may remain valid for up to 15 minutes (JWT expiration)

**Workaround:**
- Rotate API keys regularly
- Use scoped API keys with minimal permissions
- Monitor API key usage for anomalies

**Future:** Automatic key rotation may be added (not guaranteed).

---

### Encryption

**Limitation:** Encryption at rest is best-effort, not guaranteed.

**Impact:**
- Database administrators can access unencrypted data
- Backup files may be unencrypted
- Encryption keys may be compromised

**Workaround:**
- Use field-level encryption for sensitive data
- Encrypt backups separately
- Rotate encryption keys regularly

**Future:** Guaranteed encryption at rest may be added (not guaranteed).

---

## Operational Limitations

### Monitoring

**Limitation:** Monitoring coverage is incomplete.

**Impact:**
- Some failures may go undetected
- Performance degradation may not be alerted
- User-facing errors may not be logged

**Workaround:**
- Implement client-side error tracking
- Monitor external dependencies (Stripe, Supabase)
- Use third-party monitoring tools

**Future:** Comprehensive monitoring may be added (not guaranteed).

---

### Support

**Limitation:** Support is best-effort, not guaranteed.

**Impact:**
- Response times may vary
- Complex issues may require escalation
- Support availability depends on team capacity

**Workaround:**
- Use documentation and self-service resources
- Report issues with detailed logs and reproduction steps
- Escalate critical issues through support channels

**Future:** SLA-backed support may be added for enterprise plans (not guaranteed).

---

## Data Limitations

### Retention

**Limitation:** Data retention policies are not automatically enforced.

**Impact:**
- Old data may accumulate indefinitely
- Storage costs may increase over time
- Compliance requirements may not be met

**Workaround:**
- Implement manual data cleanup processes
- Use export APIs to archive old data
- Monitor storage usage regularly

**Future:** Automatic data retention may be added (not guaranteed).

---

### Export Limits

**Limitation:** Export operations are limited by file size and processing time.

**Impact:**
- Large exports may fail or timeout
- Export files may be truncated
- Export operations may affect system performance

**Workaround:**
- Split large exports into smaller batches
- Use async export APIs with webhooks
- Monitor export job status

**Future:** Larger export support may be added (not guaranteed).

---

## Performance Limitations

### Latency

**Limitation:** API latency varies by operation and load.

**Impact:**
- High-load operations may be slow
- Database queries may take seconds
- External API calls may timeout

**Workaround:**
- Implement client-side timeouts and retries
- Use async processing for long-running operations
- Monitor latency metrics and optimize queries

**Future:** Performance improvements may be added (not guaranteed).

---

### Throughput

**Limitation:** System throughput is limited by database and external APIs.

**Impact:**
- High-concurrency requests may be throttled
- Rate limits may be exceeded
- System may become unresponsive under load

**Workaround:**
- Implement request queuing on client side
- Use rate limiting to prevent overload
- Monitor system metrics and scale proactively

**Future:** Higher throughput may be added (not guaranteed).

---

## Summary

Settler has limitations in:
- **Deployment:** Single-region, no automatic failover
- **Consistency:** Eventual consistency, not immediate
- **Rate Limiting:** Falls back to in-memory if Redis unavailable
- **File Sizes:** Limited to 10MB per file
- **Processing Time:** Large operations may take minutes or hours
- **Accuracy:** AI/ML operations have confidence scores indicating uncertainty
- **Support:** Best-effort, not guaranteed

**Users must work around these limitations or accept the constraints.**

**When in doubt, assume limitations exist and plan accordingly.**
