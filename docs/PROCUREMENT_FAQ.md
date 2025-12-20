# Procurement FAQ

**Last Updated:** 2025-01-20  
**Status:** Enterprise-Ready  
**Purpose:** Procurement-friendly answers for enterprise buyers

## Overview

This document provides **procurement-friendly answers** to common questions from enterprise buyers. It is designed to help procurement teams complete security questionnaires and make purchasing decisions.

**Philosophy:** Assume buyers are skeptical and tired. Be clear, honest, and helpful.

---

## General Questions

### What is Settler?

**Answer:** Settler is a Reconciliation-as-a-Service (RaaS) platform that automates financial data reconciliation between systems. We provide APIs for matching transactions between payment processors, accounting systems, and e-commerce platforms.

**Key Points:**
- API-first platform
- Specialized reconciliation service
- Enterprise-grade security and compliance

---

### What does Settler do?

**Answer:** Settler automates transaction reconciliation between multiple systems. For example, matching Stripe payments with Shopify orders, or reconciling PayPal transactions with QuickBooks records.

**Key Points:**
- Automated matching
- High accuracy (90%+ for common cases)
- Compliance built-in

---

### What does Settler NOT do?

**Answer:** Settler does NOT:
- Process payments (we work with payment processors)
- Replace accounting software (we integrate with accounting systems)
- Provide general-purpose automation (we focus on reconciliation)
- Store payment data (we process transaction data only)

**Key Points:**
- Specialized service, not general-purpose
- Integrates with existing systems
- Does not replace core business systems

---

## Security Questions

### What security certifications does Settler have?

**Answer:** 
- **SOC 2 Type II:** Planned Q3 2026
- **ISO 27001:** Aligned (not certified)
- **GDPR:** Compliant
- **CCPA:** Compliant

**Key Points:**
- Security controls implemented
- Compliance with privacy regulations
- Certifications in progress

---

### How is data encrypted?

**Answer:**
- **In Transit:** TLS 1.3 for all API endpoints
- **At Rest:** AES-256 encryption for sensitive data (best-effort, not guaranteed)
- **Field-Level:** Sensitive fields encrypted (API keys, credentials)

**Key Points:**
- Encryption in transit guaranteed
- Encryption at rest best-effort
- Field-level encryption for sensitive data

---

### How is tenant data isolated?

**Answer:** Tenant data is isolated using Row-Level Security (RLS) at the database level. All queries are filtered by `tenant_id`, and cross-tenant data access is prevented by database policies.

**Key Points:**
- Database-level isolation
- Application-level enforcement
- No cross-tenant access possible

---

### What access controls are in place?

**Answer:**
- **Authentication:** API keys and JWT tokens
- **Authorization:** Role-based access control (RBAC)
- **Tenant Isolation:** Row-Level Security (RLS)
- **Audit Logging:** All access logged

**Key Points:**
- Multi-layer access controls
- Role-based permissions
- Comprehensive audit logging

---

## Data Questions

### Where is data stored?

**Answer:** Data is primarily stored in the US East region (us-east-1). EU data residency is available for enterprise customers.

**Key Points:**
- Primary: US East
- EU residency available (enterprise)
- Data processing agreements (DPAs) available

---

### How long is data retained?

**Answer:**
- **User Data:** Until deletion by user
- **Inactive Accounts:** 90 days after last activity
- **Deleted Accounts:** 30 days soft delete
- **Audit Logs:** 7 years (legal requirement)
- **Billing Data:** 7 years (legal requirement)

**Key Points:**
- User-controlled retention
- Compliance retention requirements
- Automatic cleanup of expired data

---

### Can data be exported?

**Answer:** Yes. Users can export their data in JSON or CSV format. Enterprise customers can request SQL database dumps.

**Key Points:**
- Self-service export available
- Multiple formats supported
- Enterprise exports available

---

### Can data be deleted?

**Answer:** Yes. Users can delete their data at any time. Deleted data is soft-deleted for 30 days, then permanently deleted.

**Key Points:**
- User-controlled deletion
- Soft delete grace period
- Permanent deletion after retention period

---

## Compliance Questions

### Is Settler GDPR compliant?

**Answer:** Yes. Settler is GDPR compliant with:
- Data export available
- Data deletion available
- Data processing agreements (DPAs) available
- Privacy policy published

**Key Points:**
- GDPR rights implemented
- DPAs available for enterprise
- Privacy-by-design principles

---

### Is Settler CCPA compliant?

**Answer:** Yes. Settler is CCPA compliant with:
- Data export available
- Data deletion available
- No data resale
- Privacy policy published

**Key Points:**
- CCPA rights implemented
- No data resale
- Privacy controls available

---

### What compliance certifications are planned?

**Answer:**
- **SOC 2 Type II:** Planned Q3 2026
- **ISO 27001:** Aligned (not certified)
- **HIPAA:** Not planned (healthcare not a focus)

**Key Points:**
- Certifications in progress
- Compliance controls implemented
- Healthcare compliance not planned

---

## Support Questions

### What support is available?

**Answer:**
- **Starter:** Community support (documentation, forums)
- **Professional:** Email support (24-48 hour response)
- **Enterprise:** Dedicated support (SLA-backed, priority response)

**Key Points:**
- Tiered support model
- Enterprise SLA-backed support
- Self-service documentation available

---

### What is the support SLA?

**Answer:**
- **Starter:** Best-effort (no SLA)
- **Professional:** 24-48 hour response (no SLA)
- **Enterprise:** Custom SLA (typically < 4 hours for critical issues)

**Key Points:**
- SLA-backed support for enterprise
- Response times vary by tier
- Custom SLAs available for enterprise

---

### How do I contact support?

**Answer:**
- **Email:** support@settler.io
- **Documentation:** https://settler.dev/docs
- **Enterprise:** Dedicated support channel (enterprise customers)

**Key Points:**
- Multiple support channels
- Self-service documentation
- Enterprise dedicated support

---

## Pricing Questions

### How is Settler priced?

**Answer:** Settler uses usage-based pricing with monthly subscriptions:
- **Starter:** $99/month (100K reconciliations, 10K receipt parses)
- **Professional:** $499/month (1M reconciliations, 100K receipt parses)
- **Enterprise:** Custom pricing (unlimited usage, SLA guarantees)

**Key Points:**
- Usage-based pricing
- Overage pricing available
- Enterprise custom pricing

---

### Are there overage charges?

**Answer:** Yes. Overage charges apply for usage beyond included limits:
- Reconciliations: $0.01-$0.005 per 1,000 (depends on plan)
- Receipt parses: $0.10-$0.08 per 100 (depends on plan)
- Feature flags: $0.001-$0.0005 per 1,000 (depends on plan)

**Key Points:**
- Overage pricing transparent
- Usage monitoring available
- Upgrade prompts when approaching limits

---

### Can pricing be customized?

**Answer:** Yes. Enterprise customers can negotiate custom pricing based on usage, requirements, and support needs.

**Key Points:**
- Custom pricing for enterprise
- Volume discounts available
- Annual contracts available

---

## Contract Questions

### What contract terms are available?

**Answer:**
- **Standard:** Month-to-month (cancel anytime)
- **Annual:** 12-month commitment (discount available)
- **Enterprise:** Custom terms (MSA, DPA, SLA)

**Key Points:**
- Flexible contract terms
- Annual discounts available
- Enterprise custom terms

---

### Are data processing agreements (DPAs) available?

**Answer:** Yes. DPAs are available for enterprise customers. Standard DPAs are available upon request.

**Key Points:**
- DPAs available for enterprise
- Standard DPAs available
- Custom DPAs negotiable

---

### Are master service agreements (MSAs) available?

**Answer:** Yes. MSAs are available for enterprise customers. Standard MSAs are available upon request.

**Key Points:**
- MSAs available for enterprise
- Standard MSAs available
- Custom MSAs negotiable

---

## Technical Questions

### What APIs are available?

**Answer:** Settler provides RESTful APIs for:
- Reconciliation (matching transactions)
- Receipts (parsing receipts)
- Feature Flags (managing feature flags)
- Webhooks (event notifications)

**Key Points:**
- RESTful API design
- Comprehensive API documentation
- SDKs available (TypeScript, Python, Ruby, Go)

---

### What integrations are supported?

**Answer:** Settler supports integrations with:
- Payment processors (Stripe, PayPal)
- Accounting systems (QuickBooks, Xero)
- E-commerce platforms (Shopify, WooCommerce)
- Custom integrations via API

**Key Points:**
- Pre-built integrations available
- Custom integrations via API
- Webhook support for real-time updates

---

### What is the uptime SLA?

**Answer:**
- **Starter:** Best-effort (no SLA)
- **Professional:** 99.5% uptime (best-effort)
- **Enterprise:** 99.9% uptime (SLA-backed)

**Key Points:**
- SLA-backed uptime for enterprise
- Best-effort uptime for lower tiers
- Monitoring and alerting available

---

## Summary

**Key Takeaways:**
- ✅ **Security:** SOC 2 planned, GDPR/CCPA compliant, encryption in transit/at rest
- ✅ **Data:** US/EU storage, user-controlled retention, export/deletion available
- ✅ **Compliance:** GDPR/CCPA compliant, SOC 2/ISO 27001 planned
- ✅ **Support:** Tiered support model, SLA-backed for enterprise
- ✅ **Pricing:** Usage-based pricing, overage charges, custom pricing for enterprise
- ✅ **Contracts:** Flexible terms, DPAs/MSAs available, annual discounts
- ✅ **Technical:** RESTful APIs, pre-built integrations, webhook support
- ✅ **Uptime:** SLA-backed for enterprise, best-effort for lower tiers

**For Enterprise Inquiries:**
- Email: enterprise@settler.io
- Support: support@settler.io
- Security: security@settler.io

**When in doubt, ask. We're here to help.**
