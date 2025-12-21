# Use Cases

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Define concrete, demonstrable use cases for each ICP

## Overview

Each use case defines:
- **Before state:** What they're doing now (the pain)
- **After state:** What they'll do with Settler (the solution)
- **Concrete outcome:** Measurable result (time saved, errors reduced, etc.)
- **Time-to-value:** How long until they see value (<7 days required)
- **Proof mechanism:** How they'll know it's working (logs, reports, outputs)

**Philosophy:** Every claim must be demonstrable in-product. No hypotheticals.

---

## Use Case #1: E-commerce Payment Reconciliation

### ICP
**E-commerce Finance Manager** (see `/docs/ICP_DEFINITIONS.md`)

### Before State
- **Manual Process:** Finance team spends 2-3 days every month reconciling Stripe payments with Shopify orders and QuickBooks records
- **Tools:** Excel spreadsheets, manual matching, VLOOKUP formulas
- **Pain Points:**
  - Time-consuming (20-30 hours/month)
  - Error-prone (5-10% mismatch rate)
  - No audit trail
  - Doesn't scale with growth
- **Current Workflow:**
  1. Export Stripe transactions (CSV)
  2. Export Shopify orders (CSV)
  3. Export QuickBooks transactions (CSV)
  4. Manual matching in Excel (VLOOKUP, pivot tables)
  5. Identify unmatched items
  6. Investigate discrepancies
  7. Create reconciliation report

### After State
- **Automated Process:** API-based reconciliation runs automatically, completes in <1 hour
- **Tools:** Settler API, Developer Console, automated webhooks
- **Benefits:**
  - Time saved (20-30 hours/month → <1 hour/month)
  - High accuracy (99%+ match rate)
  - Complete audit trail
  - Scales automatically
- **New Workflow:**
  1. Connect Stripe API (one-time setup, 5 minutes)
  2. Connect Shopify API (one-time setup, 5 minutes)
  3. Connect QuickBooks API (one-time setup, 5 minutes)
  4. Create reconciliation job (one-time setup, 5 minutes)
  5. Run reconciliation (automated, <5 minutes)
  6. View results in Console (real-time dashboard)
  7. Export reconciliation report (PDF/CSV)

### Concrete Outcome
- **Time Saved:** 20-30 hours/month → <1 hour/month (95%+ reduction)
- **Accuracy:** 5-10% mismatch rate → <1% mismatch rate (90%+ improvement)
- **Cost Savings:** $2K-$5K/month in labor costs (assuming $50-100/hour)
- **Scalability:** Handles 10K-1M+ transactions/month without additional effort

### Time-to-Value
- **First Reconciliation:** <30 minutes (after API setup)
- **First Value:** Immediate (see matched/unmatched transactions)
- **Full Value:** Within 7 days (complete monthly reconciliation cycle)

### Proof Mechanism
- **In-Product Proof:**
  - Reconciliation report showing:
    - Total transactions processed
    - Matched transactions (with confidence scores)
    - Unmatched transactions (with reasons)
    - Audit trail (timestamp, source, matching logic)
  - Console dashboard showing:
    - Reconciliation status (running, completed, failed)
    - Match rate (percentage)
    - Time saved (vs manual process)
    - Cost savings estimate
- **Exportable Proof:**
  - Reconciliation report (PDF/CSV)
  - Audit trail (JSON/CSV)
  - Matching details (transaction IDs, confidence scores)

### Demo Script
1. **Show Console:** "This is your reconciliation dashboard. You can see all your reconciliation jobs here."
2. **Show Results:** "This reconciliation processed 10K transactions in 5 minutes. 99.5% matched automatically."
3. **Show Audit Trail:** "Here's the audit trail showing exactly how each transaction was matched."
4. **Show Time Saved:** "This would have taken 20 hours manually. With Settler, it took 5 minutes."

---

## Use Case #2: Multi-Currency Reconciliation

### ICP
**SaaS Operations Lead** (see `/docs/ICP_DEFINITIONS.md`)

### Before State
- **Manual Process:** Finance team manually reconciles multi-currency transactions between Stripe, PayPal, and QuickBooks
- **Tools:** Excel spreadsheets, manual currency conversion, exchange rate lookups
- **Pain Points:**
  - Currency conversion errors (5-10% error rate)
  - Time-consuming (15-20 hours/month)
  - Exchange rate discrepancies
  - No deterministic conversion
- **Current Workflow:**
  1. Export Stripe transactions (multiple currencies)
  2. Export PayPal transactions (multiple currencies)
  3. Export QuickBooks transactions (base currency)
  4. Manual currency conversion (using exchange rates from different sources)
  5. Match transactions (accounting for conversion differences)
  6. Investigate discrepancies
  7. Create reconciliation report

### After State
- **Automated Process:** API-based multi-currency reconciliation with deterministic currency conversion
- **Tools:** Settler API, deterministic currency conversion, automated matching
- **Benefits:**
  - Deterministic currency conversion (no floating-point errors)
  - High accuracy (99%+ match rate)
  - Time saved (15-20 hours/month → <30 minutes/month)
  - Complete audit trail
- **New Workflow:**
  1. Connect Stripe API (multi-currency enabled)
  2. Connect PayPal API (multi-currency enabled)
  3. Connect QuickBooks API (base currency)
  4. Create reconciliation job (with currency conversion rules)
  5. Run reconciliation (automated, <10 minutes)
  6. View results in Console (with currency conversion details)
  7. Export reconciliation report (with conversion audit trail)

### Concrete Outcome
- **Time Saved:** 15-20 hours/month → <30 minutes/month (95%+ reduction)
- **Accuracy:** 5-10% error rate → <1% error rate (90%+ improvement)
- **Currency Errors Reduced:** Deterministic conversion prevents floating-point errors
- **Cost Savings:** $1.5K-$3K/month in labor costs

### Time-to-Value
- **First Reconciliation:** <1 hour (after API setup)
- **First Value:** Immediate (see matched transactions with currency conversion)
- **Full Value:** Within 7 days (complete monthly reconciliation cycle)

### Proof Mechanism
- **In-Product Proof:**
  - Reconciliation report showing:
    - Multi-currency transactions processed
    - Currency conversion details (exchange rates, conversion amounts)
    - Matched transactions (with conversion confidence scores)
    - Unmatched transactions (with conversion reasons)
    - Currency conversion audit trail
  - Console dashboard showing:
    - Multi-currency reconciliation status
    - Currency conversion accuracy
    - Time saved (vs manual process)
- **Exportable Proof:**
  - Reconciliation report (PDF/CSV with currency columns)
  - Currency conversion audit trail (JSON/CSV)
  - Exchange rate details (source, timestamp, rate)

### Demo Script
1. **Show Multi-Currency:** "This reconciliation processed transactions in USD, EUR, GBP, and JPY."
2. **Show Conversion:** "Here's how each currency was converted using deterministic math (no floating-point errors)."
3. **Show Accuracy:** "99.8% match rate across all currencies."
4. **Show Time Saved:** "This would have taken 20 hours manually. With Settler, it took 10 minutes."

---

## Use Case #3: Receipt Processing & Expense Reconciliation

### ICP
**E-commerce Finance Manager** or **SaaS Operations Lead**

### Before State
- **Manual Process:** Finance team manually processes receipts and matches them to expenses
- **Tools:** Manual data entry, receipt scanning, Excel spreadsheets
- **Pain Points:**
  - Time-consuming (10-15 hours/month)
  - Error-prone (manual data entry errors)
  - No automation
  - Doesn't scale
- **Current Workflow:**
  1. Collect receipts (email, photos, PDFs)
  2. Manual data entry (amount, vendor, date, category)
  3. Match to expenses (manual lookup)
  4. Create expense report
  5. Submit for approval

### After State
- **Automated Process:** AI-powered receipt parsing with automated expense matching
- **Tools:** Settler Receipts API, OCR, automated matching
- **Benefits:**
  - Automated receipt parsing (AI extracts structured data)
  - High accuracy (95%+ extraction accuracy)
  - Time saved (10-15 hours/month → <1 hour/month)
  - Automated expense matching
- **New Workflow:**
  1. Upload receipts (via API or Console, bulk upload supported)
  2. Receipt parsing (automated, <1 minute per receipt)
  3. Review parsed data (structured JSON: amount, vendor, date, category)
  4. Match to expenses (automated matching)
  5. Export expense report (PDF/CSV)

### Concrete Outcome
- **Time Saved:** 10-15 hours/month → <1 hour/month (90%+ reduction)
- **Accuracy:** 95%+ extraction accuracy (vs 80-90% manual entry)
- **Automation:** 90%+ of receipts processed automatically
- **Cost Savings:** $1K-$2K/month in labor costs

### Time-to-Value
- **First Receipt:** <1 minute (upload → parsed)
- **First Value:** Immediate (see parsed receipt data)
- **Full Value:** Within 7 days (process monthly receipt batch)

### Proof Mechanism
- **In-Product Proof:**
  - Receipt browser showing:
    - Parsed receipts (original image + structured data)
    - Extraction accuracy (confidence scores)
    - Matched expenses (with matching details)
  - Console dashboard showing:
    - Receipts processed (count, accuracy)
    - Time saved (vs manual process)
    - Cost savings estimate
- **Exportable Proof:**
  - Parsed receipt data (JSON/CSV)
  - Expense report (PDF/CSV)
  - Receipt images (with extraction overlay)

### Demo Script
1. **Show Receipt Upload:** "Upload a receipt image or PDF. Settler will parse it automatically."
2. **Show Parsed Data:** "Here's the structured data extracted: amount, vendor, date, category."
3. **Show Matching:** "This receipt was automatically matched to an expense."
4. **Show Time Saved:** "This would have taken 5 minutes manually. With Settler, it took 30 seconds."

---

## Use Case #4: Client Reconciliation for Accounting Firms

### ICP
**Accounting Firm Partner** (see `/docs/ICP_DEFINITIONS.md`)

### Before State
- **Manual Process:** Accounting firm manually reconciles transactions for multiple clients
- **Tools:** Excel spreadsheets, manual matching, client-specific processes
- **Pain Points:**
  - Time-consuming (2-4 hours/client/month)
  - Low margins (manual work is low-value)
  - Doesn't scale (can't serve more clients profitably)
  - Client-specific processes (no standardization)
- **Current Workflow:**
  1. Receive client data (various formats)
  2. Manual data normalization
  3. Manual reconciliation (per client)
  4. Create client report
  5. Bill client (low margin)

### After State
- **Automated Process:** Standardized reconciliation process across all clients
- **Tools:** Settler API, multi-tenant support, client-specific configurations
- **Benefits:**
  - Standardized process (same workflow for all clients)
  - Time saved (2-4 hours/client/month → <30 minutes/client/month)
  - Higher margins (automated work is more profitable)
  - Scales profitably (can serve more clients)
- **New Workflow:**
  1. Set up client (one-time, 5 minutes)
  2. Connect client's systems (API connections)
  3. Create reconciliation job (client-specific configuration)
  4. Run reconciliation (automated, <10 minutes)
  5. Review results (Console dashboard)
  6. Export client report (PDF/CSV)
  7. Bill client (higher margin)

### Concrete Outcome
- **Time Saved:** 2-4 hours/client/month → <30 minutes/client/month (85%+ reduction)
- **Efficiency:** 4x+ efficiency improvement
- **Margins:** 20%+ margin improvement (automated vs manual)
- **Scalability:** Can serve 2-4x more clients with same team

### Time-to-Value
- **First Client:** <1 hour (setup + first reconciliation)
- **First Value:** Immediate (see time savings per client)
- **Full Value:** Within 30 days (process monthly client batch)

### Proof Mechanism
- **In-Product Proof:**
  - Client dashboard showing:
    - Clients processed (count, time per client)
    - Time saved per client (vs manual process)
    - Margin improvement (automated vs manual)
  - Console dashboard showing:
    - Total clients processed
    - Total time saved
    - Total margin improvement
- **Exportable Proof:**
  - Client reconciliation reports (PDF/CSV)
  - Time savings report (per client)
  - Margin analysis (automated vs manual)

### Demo Script
1. **Show Client Setup:** "Set up a new client in 5 minutes. Connect their systems via API."
2. **Show Reconciliation:** "Run reconciliation for this client in <10 minutes. 99%+ accuracy."
3. **Show Time Saved:** "This would have taken 3 hours manually. With Settler, it took 10 minutes."
4. **Show Margins:** "This improves your margins by 25% per client."

---

## Use Case #5: Compliance & Audit Trail

### ICP
**Fintech Operations Manager** (see `/docs/ICP_DEFINITIONS.md`)

### Before State
- **Manual Process:** Finance team manually creates audit trails for compliance
- **Tools:** Excel spreadsheets, manual documentation, ad-hoc processes
- **Pain Points:**
  - Incomplete audit trails (missing transactions, unclear matching logic)
  - Compliance risk (regulatory audits may fail)
  - Time-consuming (10-15 hours/month)
  - Not deterministic (matching logic not reproducible)
- **Current Workflow:**
  1. Manual reconciliation
  2. Manual audit trail creation
  3. Compliance review
  4. Regulatory audit preparation

### After State
- **Automated Process:** Complete audit trail generated automatically with deterministic matching
- **Tools:** Settler API, audit trail generation, compliance-ready reports
- **Benefits:**
  - Complete audit trail (every transaction, every match, every decision)
  - Deterministic matching (reproducible, auditable)
  - Compliance-ready (meets regulatory requirements)
  - Time saved (10-15 hours/month → <1 hour/month)
- **New Workflow:**
  1. Run reconciliation (automated)
  2. Generate audit trail (automated, complete)
  3. Review compliance report (Console dashboard)
  4. Export audit trail (PDF/CSV/JSON)
  5. Submit for regulatory audit (compliance-ready)

### Concrete Outcome
- **Audit Trail Completeness:** Complete (every transaction documented)
- **Deterministic Matching:** Deterministic (reproducible, auditable)
- **Compliance Readiness:** Meets regulatory requirements
- **Time Saved:** 10-15 hours/month → <1 hour/month (90%+ reduction)

### Time-to-Value
- **First Audit Trail:** <1 hour (after reconciliation)
- **First Value:** Immediate (see complete audit trail)
- **Full Value:** Within 30 days (regulatory audit preparation)

### Proof Mechanism
- **In-Product Proof:**
  - Audit trail report showing:
    - Every transaction (source, destination, matching logic)
    - Every match (confidence score, matching rules)
    - Every decision (why matched/unmatched)
    - Complete timeline (timestamp, source, action)
  - Compliance dashboard showing:
    - Audit trail completeness (complete)
    - Deterministic matching (reproducible)
    - Compliance status (meets requirements)
- **Exportable Proof:**
  - Complete audit trail (PDF/CSV/JSON)
  - Compliance report (PDF)
  - Regulatory submission package (PDF/CSV/JSON)

### Demo Script
1. **Show Audit Trail:** "Here's the complete audit trail for this reconciliation. Every transaction is documented."
2. **Show Deterministic Matching:** "This matching is deterministic and reproducible. You can audit it anytime."
3. **Show Compliance:** "This meets regulatory requirements for audit trails."
4. **Show Time Saved:** "This would have taken 15 hours manually. With Settler, it took 30 minutes."

---

## Summary

### Common Outcomes Across Use Cases
- **Time Saved:** 85-95% reduction (20-30 hours/month → <1 hour/month)
- **Accuracy:** 90%+ improvement (5-10% error rate → <1% error rate)
- **Cost Savings:** $1K-$5K/month in labor costs
- **Scalability:** Handles 10K-1M+ transactions/month without additional effort
- **Time-to-Value:** <7 days (first reconciliation → full value)

### Proof Mechanisms
- **In-Product:** Console dashboard, reconciliation reports, audit trails
- **Exportable:** PDF/CSV/JSON reports, audit trails, compliance documentation
- **Demonstrable:** Every claim is visible in-product, no hypotheticals

---

## Related Documents

- `/docs/ICP_DEFINITIONS.md` - ICP definitions
- `/docs/VALUE_PROPOSITIONS.md` - Value messaging per ICP
- `/docs/ELEVATOR_PITCHES.md` - Sales pitches per persona
