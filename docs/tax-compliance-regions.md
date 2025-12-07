# Tax / Invoicing Compliance Across Regions

## Overview
This document outlines tax and invoicing compliance requirements for different regions where Settler operates.

## Regions

### United States
- **Sales Tax:** Varies by state (Nexus rules)
- **VAT/GST:** Not applicable
- **Invoicing:** Standard invoice format
- **Requirements:**
  - Collect sales tax in states with economic nexus
  - File quarterly/annual sales tax returns
  - Maintain tax-exempt certificates for qualified customers

### European Union
- **VAT:** Required for EU customers
- **Rate:** Varies by country (19-27%)
- **Invoicing:** EU-compliant invoice format required
- **Requirements:**
  - VAT registration in one EU country (OSS scheme)
  - Collect and remit VAT based on customer location
  - Include VAT number on invoices
  - File quarterly VAT returns

### United Kingdom
- **VAT:** Required for UK customers
- **Rate:** 20% standard rate
- **Invoicing:** UK-compliant invoice format
- **Requirements:**
  - VAT registration if revenue > £85,000
  - Collect and remit VAT
  - File quarterly VAT returns

### Canada
- **GST/HST:** Required for Canadian customers
- **Rate:** 5% GST or 13-15% HST (varies by province)
- **Invoicing:** Canadian-compliant invoice format
- **Requirements:**
  - GST/HST registration if revenue > $30,000 CAD
  - Collect and remit GST/HST
  - File annual GST/HST returns

### Australia
- **GST:** Required for Australian customers
- **Rate:** 10%
- **Invoicing:** Australian-compliant invoice format
- **Requirements:**
  - GST registration if revenue > $75,000 AUD
  - Collect and remit GST
  - File quarterly GST returns

## Implementation

### Tax Calculation
- Use tax calculation service (e.g., Stripe Tax, Avalara)
- Automatically calculate tax based on customer location
- Handle tax-exempt customers (B2B, non-profits)

### Invoicing
- Generate region-specific invoice formats
- Include required tax information
- Support multiple currencies
- Provide digital invoices (PDF)

### Compliance
- Regular tax return filings
- Maintain tax records for 7 years
- Handle tax audits
- Update tax rates as regulations change

## Tax-Exempt Customers

### B2B Customers
- Collect tax-exempt certificates
- Verify validity
- Apply exemption to invoices
- Maintain records

### Non-Profits
- Verify non-profit status
- Apply tax exemption
- Maintain documentation

## Automation

### Tax Calculation Service
- Integrate with Stripe Tax or similar
- Automatic tax calculation
- Real-time rate updates
- Multi-region support

### Invoicing System
- Automated invoice generation
- Region-specific formatting
- Multi-currency support
- Digital delivery

### Compliance Monitoring
- Track filing deadlines
- Monitor rate changes
- Alert on compliance issues
- Maintain audit trail

---

**Last Updated:** January 2026  
**Next Review:** Quarterly (or when regulations change)
