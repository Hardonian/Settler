# Limitations & Known Issues

**Last Updated:** January 2026

This document outlines known limitations, constraints, and current issues with Settler.dev. We're transparent about these to set proper expectations and help you plan accordingly.

---

## Platform Adapters

### Currently Available

**7 Platform Adapters:**

- Stripe (payment processor)
- PayPal (payment processor)
- Square (payment processor)
- Shopify (e-commerce)
- QuickBooks (accounting)
- Xero (accounting)
- Enhanced variants of above

### Coming Soon

We're actively adding new adapters. Coming soon:

- Adyen
- Braintree
- WooCommerce
- BigCommerce
- Magento
- NetSuite
- Sage

**Request an Adapter:** [settler.io/adapters/request](https://settler.io/adapters/request)

---

## Reconciliation Limits

### Free Tier

- **Reconciliations:** 1,000 per month
- **Adapters:** 2 platforms maximum
- **Log Retention:** 7 days
- **Support:** Community (Discord, GitHub)

### Commercial Tier

- **Reconciliations:** 100,000 per month
- **Adapters:** Unlimited
- **Log Retention:** 30 days
- **Support:** Email (24-hour response)

### Enterprise Tier

- **Reconciliations:** Unlimited
- **Adapters:** Unlimited
- **Log Retention:** Custom (up to 7 years)
- **Support:** Dedicated (1-hour SLA)

**Overage:** $0.01 per reconciliation beyond plan limits (automatic billing)

---

## Feature Limitations

### PDF Export

**Status:** ✅ Fully implemented

**Current Behavior:**

- CSV export: ✅ Fully functional
- JSON export: ✅ Fully functional
- PDF export: ✅ Fully functional (includes summary, matches, unmatched, errors)

**Features:**

- Professional PDF reports with summary
- Matched transactions table
- Unmatched transactions table
- Error logs
- Automatic pagination for large datasets

**Usage:**

```typescript
const exportResult = await settler.exports.create({
  jobId: "job_123",
  format: "pdf",
});
// Returns PDF file stream
```

---

### Multi-Currency

**Status:** ✅ Fully functional with automatic FX rate provider

**Current Behavior:**

- Currency conversion logic: ✅ Implemented
- FX rate storage: ✅ Implemented
- Automatic FX rate fetching: ✅ Implemented (ECB provider)

**Features:**

- Automatic FX rate fetching from ECB (European Central Bank)
- Manual rate entry support
- Historical rate support
- Rate syncing for common currencies

**Usage:**

```typescript
// Automatic: Rates fetched automatically when needed
const rate = await settler.currency.getFXRate({
  fromCurrency: "EUR",
  toCurrency: "USD",
});

// Manual sync: Sync rates for common currencies
await settler.currency.syncRates({
  baseCurrency: "USD",
});
```

---

### Custom Matching Functions

**Status:** Partially implemented

**Current Behavior:**

- Exact matching: ✅ Fully functional
- Fuzzy matching: ✅ Fully functional
- Range matching: ✅ Fully functional
- Custom JavaScript functions: ⚠️ Mentioned in docs but needs verification

**Workaround:** Use combination of exact, fuzzy, and range matching rules.

**ETA:** Q2 2026 (full custom function support)

---

### Real-Time Processing

**Status:** Event-driven (not truly real-time)

**Current Behavior:**

- Scheduled jobs: ✅ Fully functional
- Webhook integration: ✅ Fully functional
- Instant processing: ❌ Not supported

**Reality:**

- Reconciliation runs on schedule (cron) or via webhook trigger
- Processing time: Typically 1-30 seconds depending on volume
- Not "instant" - requires job execution

**Clarification:** We use "event-driven" or "near real-time" terminology to be accurate.

---

## API Limitations

### Rate Limits

**Free Tier:**

- 100 requests per 15 minutes
- Burst: 10 requests per second

**Commercial Tier:**

- 2,000 requests per 15 minutes
- Burst: 50 requests per second

**Enterprise Tier:**

- Custom rate limits
- Contact sales for details

**Rate Limit Headers:**

- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

**Exceeding Limits:** Returns `429 Too Many Requests` with retry-after header.

---

### Request Timeouts

- **API Requests:** 30 seconds
- **Webhook Delivery:** 10 seconds
- **Job Execution:** 5 minutes (configurable)

**Recommendation:** Use webhooks for long-running operations instead of polling.

---

### Data Retention

**Free Tier:**

- Transaction data: 7 days
- Logs: 7 days
- Reports: 7 days

**Commercial Tier:**

- Transaction data: 30 days
- Logs: 30 days
- Reports: 30 days

**Enterprise Tier:**

- Transaction data: Custom (up to 7 years)
- Logs: Custom (up to 7 years)
- Reports: Custom (up to 7 years)

**Data Deletion:** GDPR-compliant deletion available via API.

---

## Accuracy & Matching

### Matching Accuracy

**Typical Accuracy:** 95-99% (varies by data quality and matching rules)

**Factors Affecting Accuracy:**

- Data quality in source systems
- Matching rule configuration
- Currency differences
- Date/time discrepancies
- Missing or incomplete data

**Improving Accuracy:**

- Fine-tune matching rules
- Use fuzzy matching for text fields
- Add date range tolerance
- Review and resolve exceptions regularly

**Note:** We don't guarantee specific accuracy percentages. Accuracy depends on your data and configuration.

---

### Unmatched Transactions

**Common Reasons:**

- Missing transactions in one system
- Data quality issues (typos, formatting)
- Currency conversion differences
- Date/time mismatches
- Duplicate transactions

**Handling:**

- Review exception queue regularly
- Adjust matching rules as needed
- Manually resolve exceptions
- Use custom matching functions (when available)

---

## Enterprise Features

### Currently Available

- ✅ Unlimited reconciliations
- ✅ Unlimited adapters
- ✅ Extended log retention
- ✅ Dedicated support
- ✅ Custom integrations
- ✅ Priority feature requests

### Coming Soon

**Q2 2026:**

- SSO (SAML, OIDC)
- SOC 2 Type II certification
- White-label reports

**Q3 2026:**

- PCI-DSS Level 1 certification
- VPC peering

**Q4 2026:**

- On-premise deployment

**Note:** Enterprise features marked "Coming Soon" are not available yet. Contact sales for timelines.

---

## Known Issues

### Issue #1: XLSX Export Not Implemented

**Description:** XLSX export endpoint returns "not implemented" error.

**Impact:** Excel export not available.

**Workaround:** Use CSV export and open in Excel, or use PDF export.

**Status:** Planned (ETA: Q2 2026)

---

### Issue #2: Large PDF Exports May Timeout

**Description:** Very large reconciliation reports (>10,000 transactions) may timeout during PDF generation.

**Impact:** Large exports may fail.

**Workaround:**

- Use CSV export for large datasets
- Export in smaller date ranges
- Use pagination to process in batches

**Status:** Known limitation (will optimize in future)

---

### Issue #3: Onboarding Not Auto-Triggered

**Description:** Onboarding flow exists but not automatically shown after signup.

**Impact:** Users may not discover onboarding.

**Workaround:** Navigate to dashboard and look for onboarding prompt.

**Status:** Planned fix (ETA: Q1 2026)

---

## Performance Considerations

### Large Volume Reconciliation

**Recommendations:**

- Use scheduled jobs for large volumes
- Process in batches if possible
- Monitor job execution time
- Contact support for volume > 1M transactions/month

### API Response Times

**Typical Response Times:**

- Job creation: < 500ms
- Job status: < 200ms
- Report generation: 1-5 seconds (depends on volume)
- Export generation: 2-10 seconds (depends on format and volume)

**Note:** Response times may vary based on system load and data volume.

---

## Security & Compliance

### Current Compliance

- ✅ GDPR compliant (data export/deletion APIs)
- ✅ AES-256 encryption at rest
- ✅ TLS 1.3 in transit
- ✅ Secure API key storage

### In Progress

- ⚠️ SOC 2 Type II (audit in progress, ETA: Q2 2026)
- ⚠️ PCI-DSS Level 1 (available for Enterprise Q3 2026)
- ⚠️ HIPAA (on-demand for Enterprise)

**Note:** Compliance certifications are in progress, not yet complete.

---

## Support Limitations

### Free Tier

- Community support only (Discord, GitHub)
- No guaranteed response time
- No email support

### Commercial Tier

- Email support (24-hour response time)
- No phone support
- No dedicated account manager

### Enterprise Tier

- Dedicated account manager
- Priority support (1-hour SLA)
- Phone support available

**Support Hours:**

- Email: 24/7 (response within SLA)
- Phone: Business hours (Enterprise only)

---

## Roadmap & Future Improvements

### Q1 2026

- PDF export implementation
- Auto-trigger onboarding
- Enhanced error messages

### Q2 2026

- SSO (SAML, OIDC)
- SOC 2 Type II certification
- Automatic FX rate provider integration
- White-label reports
- Custom matching functions (full support)

### Q3 2026

- PCI-DSS Level 1 certification
- VPC peering
- Additional platform adapters (10+)

### Q4 2026

- On-premise deployment
- Advanced analytics
- Custom reporting

---

## Reporting Issues

If you encounter issues not listed here:

1. **Check Documentation:** [docs.settler.io](https://docs.settler.io)
2. **Search Discord:** [discord.gg/settler](https://discord.gg/settler)
3. **GitHub Issues:** [github.com/settler/settler/issues](https://github.com/settler/settler/issues)
4. **Email Support:** [support@settler.io](mailto:support@settler.io)

---

## Updates

This document is updated regularly as limitations are resolved and new ones are discovered. Check back monthly for updates.

**Last Updated:** January 2026  
**Next Review:** February 2026
